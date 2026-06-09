#!/usr/bin/env python3
"""
SafetyAI — Generatore cartiglio PSC
Legge i dati del cantiere da stdin (JSON), genera il cartiglio come PNG
e restituisce il risultato come base64 su stdout.
Uso: echo '{"cantiere":...}' | python3 genera_cartiglio.py
"""

import sys
import json
import base64
import io
from datetime import datetime

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.stderr.write("PIL non installato. Esegui: pip install Pillow\n")
    sys.exit(1)

# ─── COSTANTI ─────────────────────────────────────────────────────────────────
W, H = 1653, 2339          # A4 a 200 DPI
BLU = (0, 70, 127)
BIANCO = (255, 255, 255)
NERO = (10, 10, 10)
GRIGIO = (90, 90, 90)
M = 50                     # margine esterno

# Font — percorsi Windows e Linux
FONT_PATHS = {
    "regular": [
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
    "bold": [
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
}

import os

def trova_font(tipo):
    for path in FONT_PATHS[tipo]:
        if os.path.exists(path):
            return path
    return None

def get_font(tipo, size):
    path = trova_font(tipo)
    if path:
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def testo_larghezza(draw, testo, font_obj):
    try:
        bbox = draw.textbbox((0, 0), testo, font=font_obj)
        return bbox[2] - bbox[0]
    except:
        return draw.textlength(testo, font=font_obj)

def testo_multiriga_centrato(draw, testo, x, y, larghezza, font_obj, fill, line_h=40):
    """Testo multiriga centrato in una zona di larghezza data."""
    parole = testo.split()
    riga_corrente = ""
    righe = []
    for parola in parole:
        candidato = (riga_corrente + " " + parola).strip()
        if testo_larghezza(draw, candidato, font_obj) <= larghezza:
            riga_corrente = candidato
        else:
            if riga_corrente:
                righe.append(riga_corrente)
            riga_corrente = parola
    if riga_corrente:
        righe.append(riga_corrente)

    for riga in righe:
        rw = testo_larghezza(draw, riga, font_obj)
        draw.text((x + (larghezza - rw) / 2, y), riga, font=font_obj, fill=fill)
        y += line_h
    return y

def genera_cartiglio(dati):
    c = dati.get('cantiere') or {}
    comm = dati.get('committente') or {}
    cse = dati.get('cse') or {}
    csp = dati.get('csp') or {}

    nome_cse = cse.get('nome') or csp.get('nome') or ''
    studio_cse = cse.get('studio') or csp.get('studio') or ''
    indirizzo_cse = cse.get('indirizzo') or csp.get('indirizzo') or ''
    tel_cse = cse.get('telefono') or csp.get('telefono') or ''
    email_cse = cse.get('email') or csp.get('email') or ''
    pec_cse = cse.get('pec') or csp.get('pec') or ''
    ordine_cse = cse.get('ordine') or csp.get('ordine') or ''

    img = Image.new('RGB', (W, H), BIANCO)
    draw = ImageDraw.Draw(img)

    larg = W - 2 * M

    # ─── BORDO ESTERNO BLU ───────────────────────────────────────────────────
    draw.rectangle([M, M, W - M, H - M], outline=BLU, width=4)

    # ─── ZONA SUPERIORE: spazio per firma e dati studio ──────────────────────
    y_sep1 = int(H * 0.60)
    draw.line([M, y_sep1, W - M, y_sep1], fill=BLU, width=3)

    # Dati studio CSE (in basso a destra nella zona superiore)
    x_studio = int(W * 0.52)
    y_studio_base = y_sep1 - 240
    f_sb = get_font("bold", 26)
    f_sr = get_font("regular", 23)

    righe_studio = []
    if studio_cse:
        righe_studio.append((studio_cse, f_sb))
    if indirizzo_cse:
        righe_studio.append((indirizzo_cse, f_sr))
    if tel_cse:
        righe_studio.append((f"tel. {tel_cse}", f_sr))
    if email_cse:
        righe_studio.append((f"e-mail: {email_cse}", f_sr))
    if pec_cse:
        righe_studio.append((f"PEC: {pec_cse}", f_sr))
    if ordine_cse:
        righe_studio.append((ordine_cse, f_sr))

    y_s = y_studio_base
    for testo_s, font_s in righe_studio:
        draw.text((x_studio, y_s), testo_s, font=font_s, fill=NERO)
        y_s += 34

    # Nota firma (in alto a sinistra nella zona firma)
    f_firma_nota = get_font("regular", 22)
    draw.text((M + 20, M + 20), "Firma del Coordinatore per la Sicurezza:", font=f_firma_nota, fill=GRIGIO)

    # ─── TITOLO PRINCIPALE ───────────────────────────────────────────────────
    y_titolo = y_sep1 + 18
    f_titolo = get_font("bold", 54)
    titolo = "PIANO DI SICUREZZA E COORDINAMENTO"
    tw = testo_larghezza(draw, titolo, f_titolo)
    draw.text(((W - tw) / 2, y_titolo), titolo, font=f_titolo, fill=NERO)

    y_sep2 = y_titolo + 80
    draw.line([M, y_sep2, W - M, y_sep2], fill=BLU, width=2)

    # ─── DESCRIZIONE LAVORI ──────────────────────────────────────────────────
    y_desc = y_sep2 + 18
    f_desc = get_font("bold", 29)
    desc = (c.get('descrizione') or '').upper()
    y_dopo_desc = testo_multiriga_centrato(draw, desc, M + 20, y_desc, larg - 40, f_desc, NERO, 42)

    # ─── GRIGLIA DATI TECNICI ────────────────────────────────────────────────
    y_sep3 = y_dopo_desc + 18
    draw.line([M, y_sep3, W - M, y_sep3], fill=BLU, width=2)

    h_label = 55
    h_val = 62
    h_grid = h_label + h_val

    # 6 colonne: 16/16/16/16/20/16 %
    pct = [0, 0.16, 0.32, 0.48, 0.64, 0.82, 1.0]
    cols = [M + int(larg * p) for p in pct]

    f_label_s = get_font("regular", 22)
    f_val_s = get_font("bold", 34)

    codice_lav = c.get('codice_edificio') or c.get('codice_ui') or '—'
    etichette = ["REDATTO:", "VERIFICATO:", "CONTROLLATO:", "SCALA:", "CODICE LAVORO:", "N. ELABORATO:"]
    valori    = ["C.S.E.",   "C.S.E.",      "C.S.E.",       "/",      codice_lav,        "R01"]

    for i, (et, val) in enumerate(zip(etichette, valori)):
        x1, x2 = cols[i], cols[i + 1]
        draw.line([x1, y_sep3, x1, y_sep3 + h_grid], fill=BLU, width=2)
        draw.text((x1 + 8, y_sep3 + 8), et, font=f_label_s, fill=GRIGIO)
        vw = testo_larghezza(draw, val, f_val_s)
        draw.text((x1 + (x2 - x1 - vw) / 2, y_sep3 + h_label + 8), val, font=f_val_s, fill=NERO)

    draw.line([cols[-1], y_sep3, cols[-1], y_sep3 + h_grid], fill=BLU, width=2)
    draw.line([M, y_sep3 + h_label, W - M, y_sep3 + h_label], fill=BLU, width=1)
    draw.line([M, y_sep3 + h_grid,  W - M, y_sep3 + h_grid], fill=BLU, width=2)

    # ─── RIGA NOME FILE / REV / DATA ─────────────────────────────────────────
    y_file = y_sep3 + h_grid
    h_file = 62

    cx1_f = M + int(larg * 0.46)
    cx2_f = M + int(larg * 0.56)
    cx3_f = M + int(larg * 0.66)

    for cx in [cx1_f, cx2_f, cx3_f]:
        draw.line([cx, y_file, cx, y_file + h_file], fill=BLU, width=2)

    codice_ui = c.get('codice_ui') or c.get('codice_edificio') or ''
    nome_file = f"PSC_{codice_ui}.DOC" if codice_ui else "PSC.DOC"
    draw.text((M + 8, y_file + 6), "NOME FILE :", font=f_label_s, fill=GRIGIO)
    draw.text((M + 8, y_file + 30), nome_file, font=get_font("bold", 27), fill=NERO)

    draw.text((cx1_f + 8, y_file + 6), "REV:", font=f_label_s, fill=GRIGIO)
    draw.text((cx2_f + 18, y_file + 14), "0", font=get_font("bold", 38), fill=NERO)

    mesi_it = ["","GENNAIO","FEBBRAIO","MARZO","APRILE","MAGGIO","GIUGNO",
               "LUGLIO","AGOSTO","SETTEMBRE","OTTOBRE","NOVEMBRE","DICEMBRE"]
    now = datetime.now()
    data_str = f"{mesi_it[now.month]} {now.year}"
    draw.text((cx3_f + 8, y_file + 6),  "DATA REDAZIONE :", font=f_label_s, fill=GRIGIO)
    draw.text((cx3_f + 8, y_file + 30), data_str, font=get_font("bold", 30), fill=NERO)

    draw.line([M, y_file + h_file, W - M, y_file + h_file], fill=BLU, width=2)

    # ─── RIGA UNITÀ IMMOBILIARE + COMMITTENTE ─────────────────────────────────
    y_ui   = y_file + h_file
    h_ui   = H - M - y_ui - 70
    cx_mid = M + int(larg * 0.50)
    draw.line([cx_mid, y_ui, cx_mid, y_ui + h_ui], fill=BLU, width=2)

    draw.text((M + 8,      y_ui + 8), "UNITA' IMMOBILIARE",  font=f_label_s, fill=GRIGIO)
    draw.text((cx_mid + 8, y_ui + 8), "COMMITTENTE:",         font=f_label_s, fill=GRIGIO)

    # Contenuto UI
    f_ui_big = get_font("bold", 38)
    comune       = (c.get('comune')    or '').upper()
    indirizzo_c  = (c.get('indirizzo') or '').upper()
    civico_c     = (c.get('civico')    or '')
    scala_c      = (c.get('scala')     or '')
    interno_c    = (c.get('interno')   or '')
    piano_c      = (c.get('piano')     or '')
    codice_ui_d  = (c.get('codice_ui') or c.get('codice_edificio') or '').upper()

    righe_ui = [r for r in [
        comune,
        codice_ui_d,
        (indirizzo_c + (", " + civico_c if civico_c else "")).strip(),
        ("SCALA " + scala_c + " INT. " + interno_c + " PIANO " + piano_c).strip() if (scala_c or interno_c or piano_c) else "",
    ] if r.strip()]

    larg_ui = cx_mid - M - 20
    y_ui_t = y_ui + 42
    for riga in righe_ui:
        rw = testo_larghezza(draw, riga, f_ui_big)
        xr = M + 10 + max(0, (larg_ui - rw) / 2)
        draw.text((xr, y_ui_t), riga, font=f_ui_big, fill=NERO)
        y_ui_t += 52

    # Contenuto committente
    f_comm_big = get_font("bold", 33)
    f_comm_sm  = get_font("regular", 27)
    ragione_s   = comm.get('ragione_sociale') or '—'
    indir_comm  = comm.get('indirizzo') or ''

    larg_comm = (W - M) - cx_mid - 20
    y_comm_t  = y_ui + 42
    y_comm_t  = testo_multiriga_centrato(draw, ragione_s, cx_mid + 10, y_comm_t, larg_comm, f_comm_big, NERO, 44)
    if indir_comm:
        testo_multiriga_centrato(draw, indir_comm, cx_mid + 10, y_comm_t + 6, larg_comm, f_comm_sm, GRIGIO, 36)

    draw.line([M, y_ui + h_ui, W - M, y_ui + h_ui], fill=BLU, width=2)

    # ─── NOTA COPYRIGHT ──────────────────────────────────────────────────────
    y_copy = y_ui + h_ui + 10
    f_copy = get_font("regular", 19)
    nota   = ("QUESTO DOCUMENTO NON POTRA' ESSERE COPIATO O ALTRIMENTI PUBBLICATO "
              "IN TUTTO O IN PARTE SENZA IL CONSENSO SCRITTO DEL PROFESSIONISTA")
    testo_multiriga_centrato(draw, nota, M + 10, y_copy, larg - 20, f_copy, GRIGIO, 26)

    return img


if __name__ == "__main__":
    raw = sys.stdin.read()
    try:
        dati = json.loads(raw)
    except Exception as e:
        sys.stderr.write(f"JSON non valido: {e}\n")
        sys.exit(1)

    img = genera_cartiglio(dati)

    buf = io.BytesIO()
    img.save(buf, format='PNG', dpi=(200, 200))
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode('ascii')
    sys.stdout.write(b64)
