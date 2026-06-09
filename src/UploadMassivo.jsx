import { useState, useRef, useCallback } from "react";
import { salvaRisultatiAnalisi } from "./database";
import { DisclaimerExport } from "./DisclaimerExport";
import API_URL from "./config";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────


const DOC_AZIENDALI_TIPI = ["DURC", "Visura camerale", "Polizza RC", "DVR aziendale"];

// ─── REGOLE CONFORMITÀ D.Lgs 81/08 ──────────────────────────────────────────
const REGOLE_CONFORMITA = `
REGOLE DI CONFORMITÀ OBBLIGATORIE — D.Lgs 81/08 e normative correlate:

PRINCIPIO FONDAMENTALE — VALUTAZIONE INDIPENDENTE:
Ogni documento va valutato SOLO rispetto alla propria normativa di riferimento.
NON confrontare documenti diversi tra loro. NON cercare conflitti o incoerenze tra documenti di tipo diverso.
Un lavoratore può avere sia la formazione DPI che la formazione Preposto: sono obblighi distinti e indipendenti.
Un conflitto esiste SOLO all'interno dello stesso documento (es. titolo dice "generale" ma le ore sono sbagliate).

DOCUMENTI SEMPRE VALIDI — NESSUNA SCADENZA — NESSUN CONTROLLO CONFORMITÀ:
- Dichiarazione di consegna DPI: sempre valido, nessuna scadenza, conforme: true, data_scadenza: null
- Nomina RSPP, RLS, Preposto, Addetto emergenze: documento amministrativo, conforme: true
- Verbale riunione periodica: documento amministrativo, conforme: true
- Qualsiasi documento che non è un attestato di formazione: conforme: true, non applicare regole formazione

1. FORMAZIONE GENERALE LAVORATORI (art. 37 D.Lgs 81/08)
   - Durata OBBLIGATORIA: 4 ore esatte
   - NESSUNA SCADENZA: la formazione generale non scade mai, è permanente → data_scadenza: null
   - Se il documento riporta una data di scadenza per la sola formazione generale: ignorala, metti data_scadenza null
   - Se le ore sono diverse da 4: NON CONFORME

2. FORMAZIONE SPECIFICA LAVORATORI (art. 37 D.Lgs 81/08)
   - Rischio basso: 4 ore (totale con generale: 8h)
   - Rischio medio: 8 ore (totale con generale: 12h)
   - Rischio alto: 12 ore (totale con generale: 16h)
   - Rinnovo: ogni 5 anni → data_scadenza = data_rilascio + 5 anni

3. FORMAZIONE GENERALE + SPECIFICA COMBINATA SULLO STESSO PDF (caso molto comune)
   REGOLA CRITICA: se un PDF contiene sia la formazione generale che quella specifica,
   devi restituire DUE oggetti separati nell'array:
   - Oggetto 1: tipo_documento = "Formazione Generale Lavoratori"
                ore = 4, data_scadenza = null (non scade mai)
   - Oggetto 2: tipo_documento = "Formazione Specifica Lavoratori [livello rischio]"
                ore = 4/8/12, data_scadenza = data_rilascio + 5 anni
   NON restituire un oggetto unico con la data di scadenza della specifica applicata a tutto.
   La formazione generale rimane sempre valida anche quando la specifica scade.
   Esempio: PDF con 8 ore totali (4h generale + 4h specifica rischio basso) rilasciato il 21/04/2023:
   → [{tipo: "Formazione Generale Lavoratori", ore: 4, data_scadenza: null},
      {tipo: "Formazione Specifica Rischio Basso", ore: 4, data_scadenza: "21/04/2028"}]

4. PRIMO SOCCORSO (D.M. 388/2003)
   - Gruppo A (aziende a rischio elevato): 16 ore iniziali + 6 ore aggiornamento ogni 3 anni
   - Gruppo B/C (aziende a rischio medio/basso): 12 ore iniziali + 4 ore aggiornamento ogni 3 anni
   - Rinnovo: ogni 3 anni obbligatorio

5. ANTINCENDIO (D.M. 02/09/2021 — in vigore dal 04/10/2022, abroga D.M. 10/03/1998)
   - Livello 1 (ex rischio basso): 4 ore — rinnovo ogni 5 anni
   - Livello 2 (ex rischio medio): 8 ore teoria + prova pratica — rinnovo ogni 5 anni
   - Livello 3 (ex rischio alto): 16 ore teoria + prova pratica + esame VVF — rinnovo ogni 5 anni
   - Il livello si riconosce dalle ore o dalla dicitura Livello 1/2/3 sul documento
   - CALCOLO SCADENZA OBBLIGATORIO: il documento NON riporta la data di scadenza, DEVI calcolarla:
     data_scadenza = data_rilascio + 5 anni
     Esempio: corso del 02/05/2023 -> data_scadenza = 02/05/2028
   - NOTA: prima del D.M. 02/09/2021 il rinnovo era ogni 3 anni (D.M. 10/03/1998); dal 04/10/2022 vale la regola quinquennale per tutti i corsi svolti dopo il 04/10/2017

6. LAVORO IN QUOTA / DPI 3A CATEGORIA (art. 77 D.Lgs 81/08)
   - Durata minima: 8 ore teoria + pratica
   - Rinnovo: ogni 5 anni
   - ATTENZIONE: valuta SOLO questo documento, NON confrontarlo con altri documenti del lavoratore

7. CONDUZIONE CARRELLI ELEVATORI (Accordo Stato-Regioni 22/02/2012)
   - Formazione iniziale: minimo 12 ore
   - Rinnovo: ogni 5 anni, minimo 4 ore

8. PIATTAFORME ELEVATRICI / PLE (Accordo Stato-Regioni 17/04/2025 — sostituisce ASR 22/02/2012)
   - Corso PLE con solo stabilizzatori: 8 ore (4h teoria + 4h pratica)
   - Corso PLE senza solo stabilizzatori: 8 ore (4h teoria + 4h pratica)
   - Corso PLE con E senza stabilizzatori (abilitazione completa): 10 ore (4h teoria + 6h pratica)
   - Attestati rilasciati secondo il vecchio ASR 22/02/2012 (10 o 14 ore) restano validi fino a scadenza
   - Rinnovo: ogni 5 anni, corso di aggiornamento pratico di almeno 4 ore

9. IDONEITÀ SANITARIA (art. 41 D.Lgs 81/08)
   - Emessa da Medico Competente nominato dal datore di lavoro
   - Deve indicare la mansione specifica

10. PREPOSTI (Accordo Stato-Regioni 21/12/2011 + Legge 215/2021 art. 37-ter D.Lgs 81/08)
    - Formazione iniziale: 8 ore, obbligatoriamente IN PRESENZA
    - CALCOLO SCADENZA OBBLIGATORIO — il documento non riporta la data di scadenza: DEVI calcolarla:
      * Corso tenuto PRIMA del 21/12/2021: scadenza = data_rilascio + 5 anni (vecchia regola quinquennale)
      * Corso tenuto DAL 21/12/2021 IN POI: scadenza = data_rilascio + 2 anni (Legge 215/2021, biennale)
      Esempio: corso del 05/05/2023 → data_scadenza = 05/05/2025
    - Aggiornamento: 6 ore ogni 2 anni, obbligatoriamente in presenza
    - ATTENZIONE: valuta SOLO questo documento, NON confrontarlo con altri documenti del lavoratore

11. DIRIGENTI (art. 37 D.Lgs 81/08)
    - Formazione: 16 ore — Rinnovo: ogni 5 anni, 6 ore

12. PATENTE A CREDITI (D.L. 145/2023 — obbligatoria da 01/10/2024)
    - Solo per cantieri temporanei/mobili — Rilasciata da INL
    - Punteggio minimo: 15 crediti su 30

CONTROLLI ANAGRAFICI:
- Data di nascita del lavoratore: verifica che sia plausibile per un lavoratore adulto.
  Un lavoratore deve avere almeno 16 anni alla data del corso (18 per la maggior parte dei lavori).
  Se la data di nascita indica che il lavoratore aveva meno di 16 anni alla data del corso, oppure
  se la data di nascita è nel futuro o negli ultimi 16 anni rispetto alla data odierna:
  segnala come NON CONFORME con problema_conformita: "Data di nascita non plausibile: il documento
  riporta [data], il che indica che il lavoratore era minorenne o non ancora nato alla data del corso.
  Probabile errore di trascrizione dell'ente erogatore."

ISTRUZIONI FINALI:
- Valuta OGNI documento in modo INDIPENDENTE rispetto alla sua normativa specifica
- NON cercare conflitti tra documenti diversi dello stesso lavoratore
- Se le ore non sono indicate nel documento: segnala "ore non verificabili" ma non dichiarare non conforme
- Dichiarazioni di consegna DPI, nomine e verbali: sempre conforme: true, data_scadenza: null
`;

// ─── HELPERS SCADENZE ─────────────────────────────────────────────────────────
const OGGI = new Date();

function parseData(str) {
  if (!str) return null;
  const [g, m, a] = str.split("/");
  return new Date(`${a}-${m}-${g}`);
}

function giorniAllaScadenza(dataStr) {
  const d = parseData(dataStr);
  if (!d) return null;
  return Math.ceil((d - OGGI) / (1000 * 60 * 60 * 24));
}

function statoScadenza(dataStr) {
  const giorni = giorniAllaScadenza(dataStr);
  if (giorni === null) return "nessuna";
  if (giorni < 0) return "scaduto";
  if (giorni <= 15) return "critico";
  if (giorni <= 60) return "attenzione";
  return "ok";
}

const STATO_CFG = {
  ok:        { color: "#10b981", bg: "#10b98112", label: "Valido" },
  attenzione:{ color: "#f59e0b", bg: "#f59e0b12", label: "In scadenza" },
  critico:   { color: "#ef4444", bg: "#ef444412", label: "Scadenza imminente" },
  scaduto:   { color: "#ef4444", bg: "#ef444420", label: "SCADUTO" },
  nessuna:   { color: "#64748b", bg: "#64748b12", label: "Nessuna scadenza" },
};

// ─── AI EXTRACTION ────────────────────────────────────────────────────────────
async function extractDocumentData(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const contentParts = [];
  if (file.type.startsWith("image/")) {
    contentParts.push({ type: "image", source: { type: "base64", media_type: file.type, data: base64 } });
  } else if (file.type === "application/pdf") {
    contentParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
  } else {
    contentParts.push({ type: "text", text: `Nome file: ${file.name}` });
  }

  contentParts.push({
    type: "text",
    text: `Sei un esperto di sicurezza sul lavoro italiana con profonda conoscenza del D.Lgs 81/08.
Analizza questo documento e rispondi SOLO con JSON valido, senza backtick, senza markdown.

${REGOLE_CONFORMITA}

ATTENZIONE — UN PDF PUÒ CONTENERE PIÙ FORMAZIONI DISTINTE:
Se il PDF contiene più corsi o formazioni diverse (es. "Formazione generale" + "Formazione specifica", oppure un corso + il suo aggiornamento), restituisci UN OGGETTO SEPARATO per ciascuna formazione.
Ogni formazione ha la propria data di scadenza, normativa e ore indipendenti.
Esempio: un PDF con "Formazione generale (4h, nessuna scadenza)" + "Formazione specifica rischio medio (8h, scade 2028)" → array con 2 oggetti distinti.

Restituisci SEMPRE un array JSON, anche se c'è un solo documento:
[
  {
    "tipo_documento": "descrizione precisa del corso — sii specifico (es. 'Formazione specifica rischio medio' non solo 'Formazione')",
    "categoria": "aziendale oppure lavoratore",
    "nome_lavoratore": "nome e cognome esatto, null se assente",
    "codice_fiscale": "codice fiscale se presente, null se assente",
    "data_scadenza": "GG/MM/AAAA, null se non presente o formazione permanente",
    "data_rilascio": "GG/MM/AAAA, null se non presente",
    "ore_formazione": numero intero o null,
    "normativa": "normativa citata, null se assente",
    "ente_erogatore": "nome ente, null se assente",
    "conforme": true oppure false,
    "problema_conformita": "descrizione precisa del problema se non conforme, null se conforme",
    "confidenza": numero intero 0-100,
    "note": "info aggiuntive, null se niente"
  }
]

Se il PDF non è leggibile: [{"errore": "descrizione", "confidenza": 0}]`,
  });

  const response = await fetch(`${API_URL}/api/claude`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: contentParts }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    // Normalizza sempre in array
    if (Array.isArray(parsed)) return parsed;
    return [parsed]; // oggetto singolo → array con un elemento
  } catch {
    return [{ errore: "Impossibile leggere il documento", confidenza: 0 }];
  }
}

// ─── EXPORT EXCEL ─────────────────────────────────────────────────────────────
// ─── NORMALIZZAZIONE NOME LAVORATORE ─────────────────────────────────────────
// Rimuove prefissi come "Rilasciato a", normalizza spazi, mette tutto in
// "COGNOME NOME" maiuscolo per usarlo come chiave di raggruppamento.
function normalizzaNome(raw) {
  if (!raw) return "";
  let s = raw
    // Rimuovi prefissi ovunque appaiano nella stringa (non solo all'inizio)
    .replace(/rilasciato\s+a\s+/gi, "")
    .replace(/intestato\s+a\s+/gi, "")
    .replace(/\bsig\.?\s*/gi, "")
    .replace(/\bsignor\s+/gi, "")
    .replace(/\bdott\.?\s*/gi, "")
    .replace(/\bing\.?\s*/gi, "")
    // Rimuovi virgole (es. "Viola, Giancarlo")
    .replace(/,/g, " ")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
  return s;
}

// La chiave di raggruppamento ordina le parole alfabeticamente:
// "VIOLA GIANCARLO", "GIANCARLO VIOLA", "GIANCARLO RILASCIATO A VIOLA"
// diventano tutte la stessa chiave → una sola riga nell'Excel
function chiaveRaggruppamento(raw) {
  return normalizzaNome(raw)
    .split(" ")
    // Filtra parole noise che possono restare dopo la pulizia
    .filter(w => !["A", "DI", "DE", "DEL", "DELLA", "LO", "LA", "IL"].includes(w))
    .sort()
    .join(" ");
}

// ─── ABBREVIA TIPO DOCUMENTO (max 15 caratteri) ───────────────────────────────
function abbreviaTipo(tipo) {
  if (!tipo) return "—";

  // Mappatura esplicita per i tipi più comuni D.Lgs 81/08
  const MAP = {
    // Formazione base
    "formazione generale": "Form. Generale",
    "formazione specifica": "Form. Specifica",
    "formazione generale lavoratori": "Form. Generale",
    "formazione specifica lavoratori": "Form. Specifica",
    "formazione specifica rischi lavoratori": "Form. Specifica",
    "formazione specifica rischi": "Form. Specifica",
    // Preposti / dirigenti
    "formazione preposti": "Preposti",
    "aggiornamento preposti": "Agg. Preposti",
    "formazione dirigenti": "Dirigenti",
    // Primo soccorso
    "primo soccorso": "Primo Soccorso",
    "aggiornamento primo soccorso": "Agg. P.Soccorso",
    // Antincendio
    "antincendio": "Antincendio",
    "addetto antincendio": "Antincendio",
    "aggiornamento antincendio": "Agg. Antincendio",
    "antincendio livello 1": "Antinc. Liv.1",
    "antincendio livello 2": "Antinc. Liv.2",
    "antincendio livello 3": "Antinc. Liv.3",
    // Macchine / attrezzature
    "carrelli elevatori": "Carrelli Elev.",
    "carrello elevatore": "Carrelli Elev.",
    "aggiornamento carrelli elevatori": "Agg. Carrelli",
    "piattaforme elevatrici": "Form. PLE",
    "piattaforma di lavoro mobile elevatrice": "Form. PLE",
    "aggiornamento ple": "Agg. PLE",
    "ple con stabilizzatori": "Form. PLE",
    "ple senza stabilizzatori": "Form. PLE",
    "piattaforme di lavoro mobili elevabili": "Form. PLE",
    "conduzione di piattaforme": "Form. PLE",
    "gru a torre": "Gru a Torre",
    "gru su autocarro": "Gru Autocarro",
    "escavatori": "Escavatori",
    "pale caricatrici": "Pale Caricatr.",
    "terne": "Terne",
    "escavatori pale terne": "Escav./Pale/Terne",
    "aggiornamento escavatori": "Agg. Escavatori",
    // Ponteggi
    "ponteggio": "Ponteggio",
    "corso ponteggio": "Ponteggio",
    "ponteggio modulo generale": "Ponteggio Gen.",
    "ponteggio modulo tecnico": "Ponteggio Tec.",
    "ponteggio modulo pratico": "Ponteggio Prat.",
    // Lavoro in quota / DPI
    "lavoro in quota": "Quota/DPI 3a",
    "dpi terza categoria": "Quota/DPI 3a",
    "imbracature": "Imbracature",
    // Documenti personali/aziendali
    "carta di identita": "Carta Identità",
    "carta d'identità": "Carta Identità",
    "carta di identità italiana": "Carta Identità",
    "tessera sanitaria": "Tess. Sanitaria",
    "idoneita sanitaria": "Idon. Sanitaria",
    "idoneità sanitaria": "Idon. Sanitaria",
    "certificato idoneità sanitaria": "Idon. Sanitaria",
    "certificato di idoneità": "Idon. Sanitaria",
    "comunicazione assunzione": "Com. Assunzione",
    "comunicazione obbligatoria": "Com. Assunzione",
    "comunicazione obbligatoria unificato lav": "Com. Assunzione",
    "permesso di soggiorno": "Permesso Sogg.",
    "patente a crediti": "Patente Crediti",
    // DURC / aziendali
    "durc": "DURC",
    "visura camerale": "Visura",
    "polizza rc": "Polizza RC",
    "dvr": "DVR",
    "vaccinazione": "Vaccinazione",
    "vaccino": "Vaccinazione",
  };

  const lower = tipo.toLowerCase()
    .replace(/attestato di frequenza[\s\-–]+/gi, "")
    .replace(/attestato di frequenza/gi, "")
    .replace(/attestato di/gi, "")
    .replace(/formazione giuridico.normativa[\s\-–]+/gi, "")
    .replace(/formazione tecnica specialistica[\s\-–]+/gi, "")
    .replace(/formazione pratica specialistica[\s\-–]+/gi, "")
    .replace(/aggiornamento addetto alla conduzione di /gi, "Agg. ")
    .replace(/addetto alla conduzione di /gi, "")
    .replace(/\(.*?\)/g, "") // rimuovi parentesi
    .replace(/\s+/g, " ")
    .trim();

  // Cerca corrispondenza nella mappa
  for (const [k, v] of Object.entries(MAP)) {
    if (lower.includes(k)) return v;
  }

  // Fallback: tronca a 14 caratteri con puntini
  const words = lower.split(" ");
  let result = "";
  for (const w of words) {
    const candidate = result ? result + " " + w : w;
    if (candidate.length <= 13) result = candidate;
    else break;
  }
  if (!result) result = lower.slice(0, 13);
  // Capitalizza prima lettera
  return result.charAt(0).toUpperCase() + result.slice(1);
}

async function esportaExcel(elaborati, decisioniConformita, azienda) {
  const XLSX = await import("xlsx-js-style");

  // ── 1. Raggruppa per lavoratore normalizzato ──────────────────────────────
  // chiave = versione ordinata del nome (per unificare varianti)
  // valore = { nomeDisplay, docs[] }
  const perLavoratore = {};

  elaborati.forEach(doc => {
    const r = doc.risultato;
    if (!r || r.errore || r.categoria !== "lavoratore" || !r.nome_lavoratore) return;
    const chiave = chiaveRaggruppamento(r.nome_lavoratore);
    if (!perLavoratore[chiave]) {
      perLavoratore[chiave] = {
        nomeDisplay: normalizzaNome(r.nome_lavoratore), // primo nome trovato normalizzato
        docs: [],
      };
    }
    perLavoratore[chiave].docs.push(doc);
  });

  // ── 2. Raccoglie tutti i tipi unici e li abbrevia ────────────────────────
  // Per ogni tipo originale, crea un header abbreviato (≤15 char)
  // Gestisce duplicati di abbreviazione aggiungendo un suffisso numerico
  const tipiOriginali = []; // ordine di inserimento
  const tipiSet = new Set();
  elaborati.forEach(d => {
    const t = d.risultato?.tipo_documento;
    if (t && !tipiSet.has(t)) { tipiSet.add(t); tipiOriginali.push(t); }
  });

  // Mappa tipo originale → abbreviazione (senza duplicati)
  const abbrUsate = new Map(); // abbr → count
  const tipoAbbrMap = new Map(); // tipo originale → abbr finale
  tipiOriginali.forEach(t => {
    let abbr = abbreviaTipo(t);
    if (abbrUsate.has(abbr)) {
      const n = abbrUsate.get(abbr) + 1;
      abbrUsate.set(abbr, n);
      abbr = abbr.slice(0, 12) + " " + n;
    } else {
      abbrUsate.set(abbr, 1);
    }
    tipoAbbrMap.set(t, abbr);
  });

  const wb = XLSX.utils.book_new();

  // ── 3. Foglio 1: Matrice (una riga per lavoratore) ────────────────────────
  const oggi = new Date().toLocaleDateString("it-IT");
  const nomeAzienda = azienda?.nome || "Azienda";

  const titleRow = [`REGISTRO ATTESTATI SICUREZZA — ${nomeAzienda}`, ...Array(tipiOriginali.length).fill("")];
  const infoRow  = [`Generato: ${oggi} | SafetyAI`, ...Array(tipiOriginali.length).fill("")];
  const emptyRow = Array(tipiOriginali.length + 1).fill("");
  const headerRow = ["LAVORATORE", ...tipiOriginali.map(t => tipoAbbrMap.get(t).toUpperCase())];

  const allRows = [titleRow, infoRow, emptyRow, headerRow];

  // Per ogni lavoratore (riga unica) cerca il documento migliore per ogni tipo
  Object.values(perLavoratore).forEach(({ nomeDisplay, docs }) => {
    // Costruisci mappa tipo → doc più recente (o più conforme)
    const docsMap = {};
    docs.forEach(d => {
      const tipo = d.risultato?.tipo_documento;
      if (!tipo) return;
      const prev = docsMap[tipo];
      // Se già presente, tieni il più recente o quello conforme
      if (!prev) { docsMap[tipo] = d; return; }
      // Preferisci conforme su non conforme
      if (d.risultato.conforme && !prev.risultato.conforme) { docsMap[tipo] = d; return; }
      // Preferisci la data più recente
      if (d.risultato.data_rilascio > (prev.risultato.data_rilascio || "")) docsMap[tipo] = d;
    });

    const row = [nomeDisplay];
    tipiOriginali.forEach(tipo => {
      if (docsMap[tipo]) {
        const r = docsMap[tipo].risultato;
        const chiave = `${r.nome_lavoratore}__${docsMap[tipo].nomeFile}`;
        const decisione = decisioniConformita[chiave];
        const nonConforme = r.conforme === false && decisione !== "approvato";
        const giorni = giorniAllaScadenza(r.data_scadenza);

        if (nonConforme) {
          row.push(`⚠ NON CONF.\n${r.data_scadenza || "—"}`);
        } else if (giorni !== null && giorni < 0) {
          row.push(`✗ SCADUTO\n${r.data_scadenza}`);
        } else if (giorni !== null && giorni <= 30) {
          // Arancio: scade entro 30 giorni
          row.push(`⚠ SCADE PRESTO\n${r.data_scadenza}\n(${giorni}gg)`);
        } else if (giorni !== null) {
          row.push(`✓ VALIDO\n${r.data_scadenza}`);
        } else {
          // Nessuna scadenza → permanente → verde se presente
          row.push(`✓ PRESENTE\nPermanente`);
        }
      } else {
        row.push("✗ MANCANTE");
      }
    });
    allRows.push(row);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(allRows);

  const lastCol = tipiOriginali.length;
  ws1["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  ws1["!cols"] = [{ wch: 24 }, ...tipiOriginali.map(() => ({ wch: 16 }))];
  ws1["!rows"] = [{ hpt: 32 }, { hpt: 22 }, { hpt: 8 }, { hpt: 44 }];

  const styleTitle  = { font: { bold: true, sz: 13, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: "2E5FA3" } }, alignment: { horizontal: "center", vertical: "center" } };
  const styleInfo   = { font: { sz: 9, color: { rgb: "4A6080" }, name: "Arial" }, fill: { fgColor: { rgb: "EEF2F7" } }, alignment: { horizontal: "center", vertical: "center" } };
  const styleHeader = { font: { bold: true, sz: 8, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: "3A5A8C" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "medium", color: { rgb: "3B82F6" } }, bottom: { style: "medium", color: { rgb: "3B82F6" } }, left: { style: "thin", color: { rgb: "334155" } }, right: { style: "thin", color: { rgb: "334155" } } } };

  const applyStyle = (addr, style) => { if (!ws1[addr]) ws1[addr] = { v: "", t: "s" }; ws1[addr].s = style; };
  applyStyle("A1", styleTitle);
  applyStyle("A2", styleInfo);

  headerRow.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 3, c: ci });
    if (!ws1[addr]) ws1[addr] = { v: headerRow[ci], t: "s" };
    ws1[addr].s = styleHeader;
  });

  const thinBorder = { top: { style: "thin", color: { rgb: "1E2535" } }, bottom: { style: "thin", color: { rgb: "1E2535" } }, left: { style: "thin", color: { rgb: "1E2535" } }, right: { style: "thin", color: { rgb: "1E2535" } } };

  Object.values(perLavoratore).forEach(({ nomeDisplay }, ri) => {
    const rowIdx = ri + 4;
    if (!ws1["!rows"]) ws1["!rows"] = [];
    ws1["!rows"][rowIdx] = { hpt: 38 };

    const addrNome = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
    if (!ws1[addrNome]) ws1[addrNome] = { v: nomeDisplay, t: "s" };
    ws1[addrNome].s = { font: { bold: true, sz: 10, name: "Arial", color: { rgb: "1A2B45" } }, fill: { fgColor: { rgb: "F0F4F8" } }, alignment: { vertical: "center", indent: 1 }, border: thinBorder };

    tipiOriginali.forEach((_, ci) => {
      const addr = XLSX.utils.encode_cell({ r: rowIdx, c: ci + 1 });
      const val = allRows[rowIdx][ci + 1] || "";

      // Colori: verde=ok/presente, arancio=scade presto, rosso=scaduto/mancante
      let bgColor, fgColor;
      if (val.includes("MANCANTE") || val.includes("SCADUTO")) {
        bgColor = "FFE4E4"; fgColor = "C0392B"; // rosso chiaro
      } else if (val.includes("NON CONF")) {
        bgColor = "FFF0E0"; fgColor = "D35400"; // arancio chiaro
      } else if (val.includes("SCADE PRESTO")) {
        bgColor = "FFF8DC"; fgColor = "E67E22"; // giallo chiaro
      } else {
        bgColor = "E8F8F0"; fgColor = "1E8449"; // verde chiaro
      }

      if (!ws1[addr]) ws1[addr] = { v: val, t: "s" };
      ws1[addr].s = {
        font: { sz: 8, bold: val.includes("MANCANTE") || val.includes("SCADUTO"), name: "Arial", color: { rgb: fgColor } },
        fill: { fgColor: { rgb: bgColor } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: thinBorder,
      };
    });
  });

  XLSX.utils.book_append_sheet(wb, ws1, "Registro Attestati");

  // ── 4. Foglio 2: Dettaglio (invariato, con nome normalizzato) ─────────────
  const dettaglioRows = [
    ["Lavoratore", "Tipo documento", "Data rilascio", "Data scadenza", "Ore", "Ente erogatore", "Normativa", "Conforme", "Decisione operatore", "Problema conformità", "Confidenza AI"]
  ];

  elaborati.forEach(doc => {
    if (!doc.risultato || doc.risultato.errore) return;
    const r = doc.risultato;
    const chiave = `${r.nome_lavoratore}__${doc.nomeFile}`;
    const decisione = decisioniConformita[chiave] || "—";
    const nomeNorm = normalizzaNome(r.nome_lavoratore || r.categoria || "—");
    dettaglioRows.push([
      nomeNorm,
      r.tipo_documento || "—",
      r.data_rilascio || "—",
      r.data_scadenza || "—",
      r.ore_formazione || "—",
      r.ente_erogatore || "—",
      r.normativa || "—",
      r.conforme === false ? "NO" : r.conforme === true ? "SÌ" : "—",
      r.conforme === false ? decisione : "—",
      r.problema_conformita || "—",
      r.confidenza ? `${r.confidenza}%` : "—",
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(dettaglioRows);
  ws2["!cols"] = [22, 35, 13, 13, 5, 26, 18, 9, 18, 42, 12].map(w => ({ wch: w }));

  dettaglioRows[0].forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws2[addr]) ws2[addr] = { v: dettaglioRows[0][ci], t: "s" };
    ws2[addr].s = { font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { fgColor: { rgb: "3A5A8C" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
  });

  XLSX.utils.book_append_sheet(wb, ws2, "Dettaglio");

  const dataOggi = new Date().toLocaleDateString("it-IT").replace(/\//g, "-");
  XLSX.writeFile(wb, `SafetyAI_Attestati_${dataOggi}.xlsx`);
}

// ─── HELPERS UI ───────────────────────────────────────────────────────────────
function fileIcon(name) {
  if (!name) return "📄";
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "📋";
  if (["jpg", "jpeg", "png"].includes(ext)) return "🖼";
  return "📄";
}

function StatoBadge({ stato }) {
  const cfg = {
    elaborazione: { bg: "#3b82f615", color: "#60a5fa", label: "Elaborazione..." },
    ok:           { bg: "#10b98115", color: "#10b981", label: "Classificato" },
    errore:       { bg: "#ef444415", color: "#ef4444", label: "Errore lettura" },
    attesa:       { bg: "#1e2535",   color: "#475569", label: "In coda" },
  }[stato] || { bg: "#1e2535", color: "#475569", label: stato };

  return (
    <span style={{ padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {stato === "elaborazione" && <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: 10 }}>⟳</span>}
      {cfg.label}
    </span>
  );
}

// ─── SCHERMATA SCADENZE ───────────────────────────────────────────────────────
function SchermatScadenze({ elaborati, azienda, appaltoSelId, appaltatoreSelId, salvato, onSalvaDB, onRicarica }) {
  const [exportando, setExportando] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  // chiave: "nomeLavoratore__nomeFile" → "approvato" | "scartato"
  const [decisioniConformita, setDecisioniConformita] = useState({});

  const perLavoratore = elaborati.reduce((acc, doc) => {
    if (doc.risultato?.categoria === "lavoratore" && doc.risultato?.nome_lavoratore) {
      const nome = doc.risultato.nome_lavoratore;
      if (!acc[nome]) acc[nome] = [];
      acc[nome].push(doc);
    }
    return acc;
  }, {});

  const docAziendali = elaborati.filter(d =>
    d.risultato?.categoria === "aziendale" || DOC_AZIENDALI_TIPI.includes(d.risultato?.tipo_documento)
  );

  // Conta non conformi ancora in attesa di decisione
  const nonConformiInAttesa = elaborati.filter(d => {
    if (d.risultato?.conforme !== false) return false;
    const chiave = `${d.risultato?.nome_lavoratore}__${d.nomeFile}`;
    return !decisioniConformita[chiave];
  }).length;

  function statoLavoratore(docs) {
    const haaNonConforme = docs.some(d => {
      if (d.risultato?.conforme !== false) return false;
      const chiave = `${d.risultato?.nome_lavoratore}__${d.nomeFile}`;
      return decisioniConformita[chiave] !== "approvato";
    });
    if (haaNonConforme) return "nonconforme";
    const stati = docs.map(d => statoScadenza(d.risultato?.data_scadenza));
    if (stati.includes("scaduto")) return "scaduto";
    if (stati.includes("critico")) return "critico";
    if (stati.includes("attenzione")) return "attenzione";
    return "ok";
  }

  function apriPdf(doc) {
    if (!doc.file) return;
    window.open(URL.createObjectURL(doc.file), "_blank");
  }

  function setDecisione(nomeLavoratore, nomeFile, decisione) {
    const chiave = `${nomeLavoratore}__${nomeFile}`;
    setDecisioniConformita(prev => ({ ...prev, [chiave]: decisione }));
  }

  // Mostra prima il disclaimer, poi esegue l'export reale
  function handleExport() {
    setShowDisclaimer(true);
  }

  async function doExport() {
    setShowDisclaimer(false);
    setExportando(true);
    try { await esportaExcel(elaborati, decisioniConformita, azienda); }
    catch (e) { alert("Errore durante l'export: " + e.message); }
    finally { setExportando(false); }
  }

  const statoColore = { ok: "#10b981", attenzione: "#f59e0b", critico: "#ef4444", scaduto: "#ef4444", nonconforme: "#f97316", nessuna: "#64748b" };
  const statoLabel = { ok: "Valido", attenzione: "In scadenza", critico: "Scadenza imminente", scaduto: "SCADUTO", nonconforme: "Non conforme", nessuna: "—" };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", padding: "32px 24px", color: "#e2e8f0", maxWidth: 760, margin: "0 auto" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Disclaimer export — modale con avviso responsabilita' */}
      {showDisclaimer && (
        <DisclaimerExport
          onConferma={doExport}
          onAnnulla={() => setShowDisclaimer(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white" }}>S</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>SafetyAI</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>Situazione documentale</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{azienda?.nome || "SafetyAI"}</div>
        </div>
        <button
          onClick={handleExport}
          disabled={exportando || nonConformiInAttesa > 0}
          title={nonConformiInAttesa > 0 ? "Gestisci prima i documenti non conformi" : ""}
          style={{
            padding: "11px 20px", borderRadius: 10, flexShrink: 0,
            background: nonConformiInAttesa > 0 ? "#1e2535" : exportando ? "#1e2535" : "linear-gradient(135deg, #16a34a, #15803d)",
            border: nonConformiInAttesa > 0 ? "1px solid #334155" : "none",
            color: nonConformiInAttesa > 0 ? "#475569" : "white",
            fontSize: 13, fontWeight: 700,
            cursor: nonConformiInAttesa > 0 || exportando ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
          {exportando ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> : "📊"}
          {exportando ? "Esportando..." : nonConformiInAttesa > 0 ? `Gestisci ${nonConformiInAttesa} non conforme/i` : "Esporta Excel"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Lavoratori", value: Object.keys(perLavoratore).length, color: "#60a5fa" },
          { label: "In attesa decisione", value: nonConformiInAttesa, color: nonConformiInAttesa > 0 ? "#f97316" : "#334155" },
          { label: "Validi", value: elaborati.filter(d => d.risultato?.conforme !== false && statoScadenza(d.risultato?.data_scadenza) === "ok").length, color: "#10b981" },
          { label: "Da rinnovare", value: elaborati.filter(d => ["scaduto","critico","attenzione"].includes(statoScadenza(d.risultato?.data_scadenza))).length, color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lavoratori */}
      {Object.keys(perLavoratore).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 14 }}>
            LAVORATORI — {Object.keys(perLavoratore).length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(perLavoratore).map(([nome, docs]) => {
              const stato = statoLavoratore(docs);
              const colore = statoColore[stato] || "#64748b";
              const label = statoLabel[stato] || stato;

              return (
                <div key={nome} style={{ background: "#161b27", border: `1px solid ${["scaduto","critico","nonconforme"].includes(stato) ? colore + "40" : "#1e2535"}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, background: `${colore}08` }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: `${colore}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: colore }}>
                      {nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{nome}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{docs.length} documenti</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 20, background: colore + "20", color: colore, fontSize: 11, fontWeight: 700 }}>{label}</span>
                  </div>

                  <div style={{ borderTop: "1px solid #1e2535" }}>
                    {docs.map((doc, i) => {
                      const r = doc.risultato;
                      const chiave = `${nome}__${doc.nomeFile}`;
                      const decisione = decisioniConformita[chiave];
                      const nonConforme = r?.conforme === false;
                      const statoDoc = statoScadenza(r?.data_scadenza);
                      const cfgDoc = STATO_CFG[statoDoc];
                      const giorni = giorniAllaScadenza(r?.data_scadenza);
                      const bordoColore = nonConforme && decisione !== "approvato" ? "#f97316" : cfgDoc.color;

                      return (
                        <div key={i} style={{ padding: "12px 20px", borderBottom: i < docs.length - 1 ? "1px solid #1e253540" : "none", borderLeft: `3px solid ${bordoColore}` }}>
                          {/* Riga principale: icona + info + scadenza + verifica */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{fileIcon(doc.nomeFile)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>{r?.tipo_documento || doc.nomeFile}</div>
                              <div style={{ fontSize: 11, color: "#475569", marginTop: 3, display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {r?.data_rilascio && <span>Rilascio: <strong style={{ color: "#64748b" }}>{r.data_rilascio}</strong></span>}
                                {r?.ore_formazione && <span>🕐 {r.ore_formazione}h</span>}
                                {r?.ente_erogatore && <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📋 {r.ente_erogatore}</span>}
                                {r?.normativa && <span style={{ color: "#a78bfa" }}>{r.normativa}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              {r?.data_scadenza ? (
                                <>
                                  <span style={{ padding: "3px 8px", borderRadius: 20, background: cfgDoc.bg, color: cfgDoc.color, fontSize: 11, fontWeight: 700 }}>{r.data_scadenza}</span>
                                  {giorni !== null && (
                                    <div style={{ fontSize: 10, color: cfgDoc.color, marginTop: 3, fontWeight: 600 }}>
                                      {giorni < 0 ? `scaduto ${Math.abs(giorni)}gg fa` : `${giorni} giorni`}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontSize: 11, color: "#334155" }}>Nessuna scadenza</span>
                              )}
                            </div>
                            {doc.file && (
                              <button
                                onClick={() => apriPdf(doc)}
                                style={{ padding: "6px 10px", background: "#1e2535", border: "1px solid #334155", borderRadius: 7, color: "#94a3b8", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
                                onMouseOver={e => { e.currentTarget.style.background = "#2d3748"; e.currentTarget.style.color = "#f1f5f9"; }}
                                onMouseOut={e => { e.currentTarget.style.background = "#1e2535"; e.currentTarget.style.color = "#94a3b8"; }}
                              >
                                👁 Verifica
                              </button>
                            )}
                          </div>

                          {/* Blocco non conformità — sotto a tutta larghezza */}
                          {nonConforme && (
                            <div style={{ marginTop: 10, padding: "10px 14px", background: "#f9731610", border: "1px solid #f9731630", borderRadius: 8 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ fontSize: 11, color: "#fdba74", flex: 1 }}>
                                  ⚠ <strong>Non conforme:</strong> {r.problema_conformita}
                                </div>
                                {!decisione && (
                                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                    <button
                                      onClick={() => setDecisione(nome, doc.nomeFile, "approvato")}
                                      style={{ padding: "4px 12px", background: "#10b98120", border: "1px solid #10b98140", borderRadius: 6, color: "#10b981", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                                      ✓ Approva
                                    </button>
                                    <button
                                      onClick={() => setDecisione(nome, doc.nomeFile, "scartato")}
                                      style={{ padding: "4px 12px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: 6, color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                                      ✗ Scarta
                                    </button>
                                  </div>
                                )}
                                {decisione === "approvato" && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>✓ Approvato</span>
                                    <button onClick={() => setDecisione(nome, doc.nomeFile, null)} style={{ background: "none", border: "none", color: "#475569", fontSize: 10, cursor: "pointer" }}>annulla</button>
                                  </div>
                                )}
                                {decisione === "scartato" && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>✗ Scartato</span>
                                    <button onClick={() => setDecisione(nome, doc.nomeFile, null)} style={{ background: "none", border: "none", color: "#475569", fontSize: 10, cursor: "pointer" }}>annulla</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Doc aziendali */}
      {docAziendali.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 14 }}>DOCUMENTI AZIENDALI — {docAziendali.length}</div>
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
            {docAziendali.map((doc, i) => {
              const cfgDoc = STATO_CFG[statoScadenza(doc.risultato?.data_scadenza)];
              return (
                <div key={i} style={{ padding: "13px 20px", borderBottom: i < docAziendali.length - 1 ? "1px solid #1e253540" : "none", display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${cfgDoc.color}` }}>
                  <span style={{ fontSize: 18 }}>{fileIcon(doc.nomeFile)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{doc.risultato?.tipo_documento || doc.nomeFile}</div>
                    {doc.risultato?.data_scadenza && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Scadenza: <strong style={{ color: cfgDoc.color }}>{doc.risultato.data_scadenza}</strong></div>}
                  </div>
                  {doc.file && (
                    <button onClick={() => window.open(URL.createObjectURL(doc.file), "_blank")} style={{ padding: "6px 10px", background: "#1e2535", border: "1px solid #334155", borderRadius: 7, color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>
                      👁 Verifica
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Salva nel database */}
      {azienda && appaltoSelId && appaltatoreSelId && (
        <div style={{ marginBottom: 10 }}>
          {salvato ? (
            <div style={{ padding: "12px 16px", background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 9, fontSize: 13, color: "#34d399", display: "flex", alignItems: "center", gap: 8 }}>
              ✓ Salvato nel database — {salvato.nuoviLavoratori} nuovi lavoratori, {salvato.nuoviAttestati} nuovi attestati
            </div>
          ) : (
            <button
              onClick={() => onSalvaDB(elaborati, decisioniConformita)}
              style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#10b981,#06b6d4)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              💾 Salva nel database
            </button>
          )}
        </div>
      )}

      <button onClick={onRicarica} style={{ width: "100%", padding: "13px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 10, color: "#64748b", fontSize: 13, cursor: "pointer" }}>
        ← Carica altri documenti
      </button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PortaleUploadMassivo({ azienda }) {
  const [step, setStep] = useState("upload");
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const [elaborati, setElaborati] = useState([]);
  const [progress, setProgress] = useState({ fatto: 0, totale: 0 });
  const [appaltoSelId, setAppaltoSelId] = useState("");
  const [appaltatoreSelId, setAppaltatoreSelId] = useState("");
  const [salvato, setSalvato] = useState(null); // { nuoviLavoratori, nuoviAttestati }
  const inputRef = useRef();

  const handleFiles = useCallback((newFiles) => setFiles(Array.from(newFiles)), []);
  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false); };
  const handleDrop = (e) => { e.preventDefault(); dragCounter.current = 0; setDragOver(false); handleFiles(e.dataTransfer.files); };

  const startElaboration = async () => {
    if (files.length === 0) return;
    setStep("elaborazione");
    const initial = files.map(f => ({ nomeFile: f.name, stato: "attesa", risultato: null, file: f }));
    setElaborati(initial);
    setProgress({ fatto: 0, totale: files.length });
    const results = [...initial];
    // Array finale espanso — un PDF con più formazioni genera più voci
    const expanded = [];

    for (let i = 0; i < files.length; i += 3) {
      const batch = files.slice(i, i + 3);
      batch.forEach((_, bi) => { results[i + bi] = { ...results[i + bi], stato: "elaborazione" }; });
      setElaborati([...results]);
      await Promise.all(batch.map(async (file, bi) => {
        try {
          const arrayRisultati = await extractDocumentData(file); // ora è sempre un array
          if (arrayRisultati.length === 1) {
            // Caso normale: un risultato per file
            const r = arrayRisultati[0];
            results[i + bi] = { ...results[i + bi], stato: r.errore ? "errore" : "ok", risultato: r };
          } else {
            // PDF con più formazioni: prima voce aggiorna la riga esistente,
            // le altre vengono aggiunte come voci extra con suffix nel nome
            results[i + bi] = {
              ...results[i + bi],
              stato: arrayRisultati[0].errore ? "errore" : "ok",
              risultato: arrayRisultati[0],
              vociExtra: arrayRisultati.slice(1).map((r, idx) => ({
                nomeFile: `${file.name} [${idx + 2}/${arrayRisultati.length}]`,
                stato: r.errore ? "errore" : "ok",
                risultato: r,
                file: file,
              })),
            };
          }
        } catch {
          results[i + bi] = { ...results[i + bi], stato: "errore", risultato: { errore: "Errore di connessione", confidenza: 0 } };
        }
        setProgress(p => ({ ...p, fatto: p.fatto + 1 }));
        setElaborati([...results]);
      }));
    }

    // Espandi le voci extra in una lista piatta
    const elaboratiFinali = [];
    results.forEach(r => {
      elaboratiFinali.push(r);
      if (r.vociExtra) r.vociExtra.forEach(v => elaboratiFinali.push(v));
    });

    setElaborati(elaboratiFinali);
    setStep("risultati");
  };

  const pct = progress.totale > 0 ? Math.round((progress.fatto / progress.totale) * 100) : 0;

  if (step === "risultati") {
    return (
      <SchermatScadenze
        elaborati={elaborati}
        azienda={azienda}
        appaltoSelId={appaltoSelId}
        appaltatoreSelId={appaltatoreSelId}
        salvato={salvato}
        onSalvaDB={(elaboratiFinali, decisioni) => {
          if (azienda && appaltoSelId && appaltatoreSelId) {
            const res = salvaRisultatiAnalisi(azienda.id, appaltoSelId, appaltatoreSelId, elaboratiFinali, decisioni);
            setSalvato(res);
          }
        }}
        onRicarica={() => { setStep("upload"); setFiles([]); setElaborati([]); setSalvato(null); }}
      />
    );
  }

  if (step === "elaborazione") {
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", padding: "40px 24px", color: "#e2e8f0", maxWidth: 640, margin: "0 auto" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", border: "3px solid #1e2535", borderTop: "3px solid #3b82f6", animation: "spin 0.9s linear infinite" }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Analisi in corso</div>
          <div style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>L'AI legge, classifica e verifica la conformità normativa</div>
        </div>
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{progress.fatto} di {progress.totale} documenti</span>
            <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 800 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "#1e2535", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #3b82f6, #06b6d4)", borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
        </div>
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden", maxHeight: 360, overflowY: "auto" }}>
          {elaborati.map((doc, i) => (
            <div key={i} style={{ padding: "11px 20px", borderBottom: i < elaborati.length - 1 ? "1px solid #1e253540" : "none", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16 }}>{fileIcon(doc.nomeFile)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.nomeFile}</div>
                {doc.risultato?.nome_lavoratore && <div style={{ fontSize: 11, color: "#10b981", marginTop: 2 }}>→ {doc.risultato.nome_lavoratore} · {doc.risultato.tipo_documento}</div>}
              </div>
              <StatoBadge stato={doc.stato} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", padding: "40px 24px", color: "#e2e8f0", maxWidth: 640, margin: "0 auto" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white" }}>S</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>SafetyAI</span>
        </div>
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.8px", marginBottom: 8 }}>CARICA DOCUMENTI</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{azienda?.nome || "Nessuna azienda selezionata"}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{azienda?.settore || ""}</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 8 }}>Carica tutti i documenti</div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          Seleziona attestati, idoneità e documenti aziendali. <strong style={{ color: "#60a5fa" }}>L'AI li classifica e verifica la conformità normativa</strong>.
        </div>
      </div>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? "#3b82f6" : files.length > 0 ? "#10b981" : "#1e2535"}`, borderRadius: 16, padding: files.length > 0 ? "32px 24px" : "56px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#3b82f610" : files.length > 0 ? "#10b98108" : "#161b27", transition: "all 0.2s", marginBottom: 20 }}
      >
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        {files.length === 0 ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📂</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>Trascina tutti i documenti qui</div>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>PDF, JPG, PNG · Fino a 100 file insieme</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981", marginBottom: 4 }}>{files.length} file selezionati</div>
            <div style={{ maxHeight: 180, overflowY: "auto", background: "#0f1117", borderRadius: 10, padding: "8px 0", textAlign: "left", marginTop: 12 }}>
              {Array.from(files).map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 16px", borderBottom: i < files.length - 1 ? "1px solid #1e253530" : "none" }}>
                  <span style={{ fontSize: 13 }}>{fileIcon(f.name)}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <span style={{ fontSize: 10, color: "#334155" }}>{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button onClick={startElaboration} disabled={files.length === 0} style={{ width: "100%", padding: "15px", background: files.length > 0 ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "#1e2535", border: "none", borderRadius: 12, color: files.length > 0 ? "white" : "#334155", fontSize: 15, fontWeight: 800, cursor: files.length > 0 ? "pointer" : "not-allowed" 