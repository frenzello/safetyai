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

def get_initials(nome):
    """Estrae le iniziali dal nome del CSE: 'ing. Marco Zanuso' → 'M.Z.'"""
    if not nome:
        return 'C.S.E.'
    titoli = {'ing', 'arch', 'geom', 'dr', 'dott', 'prof', 'avv', 'per', 'ind', 'p', 'a'}
    parole = nome.replace('.', ' ').split()
    parole_nome = [p for p in parole if p.strip() and p.lower().rstrip('.') not in titoli and len(p) > 1]
    if not parole_nome:
        return 'C.S.E.'
    iniziali = '.'.join(p[0].upper() for p in parole_nome if p and p[0].isalpha()) + '.'
    return iniziali


def draw_dashed_rect(draw, xy, fill, width=2, dash=12, gap=7):
    """Disegna un rettangolo tratteggiato."""
    x0, y0, x1, y1 = xy
    for side in ['top', 'bottom', 'left', 'right']:
        if side in ('top', 'bottom'):
            y = y0 if side == 'top' else y1
            x = x0
            while x < x1:
                draw.line([(x, y), (min(x + dash, x1), y)], fill=fill, width=width)
                x += dash + gap
        else:
            x = x0 if side == 'left' else x1
            y = y0
            while y < y1:
                draw.line([(x, y), (x, min(y + dash, y1))], fill=fill, width=width)
                y += dash + gap


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
    sigla_cse = get_initials(nome_cse)

    img = Image.new('RGB', (W, H), BIANCO)
    draw = ImageDraw.Draw(img)

    larg = W - 2 * M

    # ─── BORDO ESTERNO BLU ───────────────────────────────────────────────────
    draw.rectangle([M, M, W - M, H - M], outline=BLU, width=4)

    # ─── ZONA SUPERIORE: firma + timbro (sx) e dati studio (dx) ─────────────
    y_sep1 = int(H * 0.60)
    draw.line([M, y_sep1, W - M, y_sep1], fill=BLU, width=3)

    # Divisore verticale che separa firma (sx) da dati studio (dx)
    x_div_firma = int(W * 0.50)
    draw.line([x_div_firma, M, x_div_firma, y_sep1], fill=BLU, width=2)

    # ── Colonna sinistra: box firma + box timbro ─────────────────────────────
    f_firma_nota = get_font("regular", 22)
    f_firma_label = get_font("bold", 20)
    GRIGIO_CH = (130, 130, 130)

    # Etichetta colonna sinistra
    draw.text((M + 16, M + 16),
              "Firma e timbro del Coordinatore per la Sicurezza in fase di Esecuzione:",
              font=f_firma_nota, fill=GRIGIO)

    larg_box = x_div_firma - M - 32   # larghezza disponibile per i box
    y_box_top = M + 60

    # Divide lo spazio in due box: FIRMA (60%) | TIMBRO (40%)
    w_firma = int(larg_box * 0.58)
    w_timbro = larg_box - w_firma - 16
    h_box = y_sep1 - y_box_top - 20

    # Box FIRMA
    bx0 = M + 16
    draw_dashed_rect(draw, (bx0, y_box_top, bx0 + w_firma, y_box_top + h_box), GRIGIO_CH, width=2)
    draw.text((bx0 + 8, y_box_top + 8), "FIRMA", font=f_firma_label, fill=GRIGIO_CH)

    # Box TIMBRO
    bx1 = bx0 + w_firma + 16
    draw_dashed_rect(draw, (bx1, y_box_top, bx1 + w_timbro, y_box_top + h_box), GRIGIO_CH, width=2)
    draw.text((bx1 + 8, y_box_top + 8), "TIMBRO", font=f_firma_label, fill=GRIGIO_CH)

    # ── Colonna destra: dati studio CSE ─────────────────────────────────────
    x_studio = x_div_firma + 20
    y_studio_base = M + 50
    f_sb = get_font("bold", 26)
    f_sr = get_font("regular", 23)

    righe_studio = []
    if nome_cse:
        righe_studio.append((nome_cse, f_sb))
    if studio_cse:
        righe_studio.append((studio_cse, f_sr))
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
        y_s += 36

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
    valori    = [sigla_cse,  sigla_cse,     sigla_cse,      "/",      codice_lav,        "R01"]

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
