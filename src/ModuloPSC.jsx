import { useState, useCallback } from "react";
import API_URL from "./config";

// ─── TIPI DI CANTIERE ─────────────────────────────────────────────────────────
const TIPI_CANTIERE = [
  { id: "manutenzione_appartamento", label: "Manutenzione appartamento", icon: "🏠",
    desc: "Manutenzione ordinaria/straordinaria di unità immobiliare in condominio" },
  { id: "ristrutturazione_edificio", label: "Ristrutturazione edificio", icon: "🏢",
    desc: "Ristrutturazione parziale o totale di edificio residenziale o commerciale" },
  { id: "rifacimento_copertura", label: "Rifacimento copertura", icon: "🏗️",
    desc: "Rifacimento tetto, impermeabilizzazione, lattoneria" },
  { id: "impianti_fotovoltaici", label: "Impianti fotovoltaici", icon: "☀️",
    desc: "Installazione impianto fotovoltaico su copertura" },
  { id: "nuova_costruzione", label: "Nuova costruzione", icon: "🏛️",
    desc: "Costruzione ex-novo di edificio o manufatto" },
  { id: "demolizione", label: "Demolizione", icon: "🔨",
    desc: "Demolizione parziale o totale di strutture esistenti" },
  { id: "opere_stradali", label: "Opere stradali / sottoservizi", icon: "🛣️",
    desc: "Lavori su sede stradale, posa tubazioni, cavidotti" },
];

// ─── HELPER: leggi file come base64 ──────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── HELPER: formatta dimensione file ────────────────────────────────────────
function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

// ─── HELPER: estrai dati cantiere dai documenti con AI ───────────────────────
// Estrae testo grezzo da un file DOCX usando mammoth (lato client)
async function estraiTestoDaDocx(file) {
  try {
    const mammoth = await import("https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
  } catch {
    // Fallback: ritorna solo il nome file se mammoth non disponibile
    return `[Documento: ${file.name} - contenuto non leggibile]`;
  }
}

async function estraiDatiDaDocumenti(files) {
  const contentParts = [];

  for (const file of files) {
    const isPdf = file.type === "application/pdf";
    const isDocx = file.name.endsWith(".docx") || file.name.endsWith(".doc");
    const isImage = file.type.startsWith("image/");

    if (isPdf) {
      const b64 = await fileToBase64(file);
      contentParts.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: b64 },
      });
      contentParts.push({ type: "text", text: `[File PDF: ${file.name}]` });
    } else if (isDocx) {
      // I DOCX non sono supportati come documento da Claude API:
      // estraiamo il testo e lo inviamo come testo semplice
      const testo = await estraiTestoDaDocx(file);
      contentParts.push({
        type: "text",
        text: `[File DOCX: ${file.name}]

${testo}`,
      });
    } else if (isImage) {
      const b64 = await fileToBase64(file);
      contentParts.push({
        type: "image",
        source: { type: "base64", media_type: file.type, data: b64 },
      });
      contentParts.push({ type: "text", text: `[Immagine: ${file.name}]` });
    }
  }

  contentParts.push({
    type: "text",
    text: `Analizza questi documenti relativi a un cantiere edile e estrai TUTTI i dati utili per redigere un Piano di Sicurezza e Coordinamento (PSC) ai sensi del D.Lgs. 81/08.

Restituisci SOLO un oggetto JSON valido con questa struttura (usa null per i campi non trovati):

{
  "cantiere": {
    "descrizione": "descrizione sintetica dell'intervento",
    "indirizzo": "indirizzo completo del cantiere",
    "comune": "comune",
    "provincia": "sigla provincia",
    "codice_edificio": "codice se presente",
    "codice_ui": "codice unità immobiliare se presente",
    "scala": "scala",
    "interno": "interno",
    "piano": "piano",
    "particella": "particella catastale",
    "superficie_mq": "superficie in mq",
    "anno_costruzione": "anno",
    "data_inizio": "data presunta inizio in formato gg/mm/aaaa",
    "durata_mesi": "durata in mesi (numero intero)",
    "importo_cme": "importo complessivo in euro (solo numero)",
    "n_imprese": "numero presunto imprese (numero intero)",
    "n_lavoratori_autonomi": "numero presunto lavoratori autonomi",
    "n_max_lavoratori": "numero massimo presunto lavoratori"
  },
  "committente": {
    "ragione_sociale": "nome committente",
    "indirizzo": "indirizzo",
    "telefono": "telefono",
    "fax": "fax",
    "email": "email",
    "pec": "pec"
  },
  "responsabile_lavori": {
    "nome": "nome e cognome con titolo",
    "ruolo": "ruolo (es. RUP)",
    "azienda": "azienda di appartenenza",
    "telefono": "telefono"
  },
  "progettista": {
    "nome": "nome e cognome con titolo",
    "azienda": "azienda"
  },
  "direttore_lavori": {
    "nome": "nome e cognome con titolo",
    "azienda": "azienda"
  },
  "csp": {
    "nome": "nome e cognome con titolo del Coordinatore per la Progettazione",
    "ordine": "iscrizione albo professionale",
    "studio": "studio professionale",
    "indirizzo": "indirizzo studio"
  },
  "cse": {
    "nome": "nome e cognome con titolo del Coordinatore per l'Esecuzione",
    "ordine": "iscrizione albo professionale",
    "studio": "studio professionale",
    "indirizzo": "indirizzo studio",
    "telefono": "telefono"
  },
  "impresa_appaltatrice": {
    "ragione_sociale": "nome impresa",
    "specializzazione": "tipo di lavori (es. Lavori edili, coordinamento)",
    "indirizzo": "indirizzo",
    "telefono": "telefono",
    "email": "email",
    "pec": "pec"
  },
  "subappaltatori": [
    {
      "numero": "01",
      "specializzazione": "tipo di lavori (es. Impianti elettrici)",
      "ragione_sociale": "nome impresa",
      "indirizzo": "indirizzo",
      "telefono": "telefono",
      "email": "email",
      "pec": "pec"
    }
  ],
  "lavorazioni": [
    {
      "descrizione": "descrizione della lavorazione",
      "impresa": "sigla o nome impresa che la esegue"
    }
  ],
  "morfologia_sito": "descrizione del contesto fisico del cantiere (tipo edificio, contesto urbano, ecc.)",
  "note_organizzazione": "eventuali note sull'organizzazione del cantiere"
}

IMPORTANTE: 
- Estrai i dati ESATTAMENTE come scritti nei documenti
- Per le email e PEC rimuovi eventuali link HTML e tieni solo l'indirizzo email puro
- Per i telefoni rimuovi link HTML e tieni solo il numero
- Non inventare dati non presenti nei documenti, usa null
- I subappaltatori devono essere un array anche se ce n'è uno solo`,
  });

  const response = await fetch("${API_URL}/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: contentParts }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "errore sconosciuto");
    throw new Error(`Errore server ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = data.content?.map(b => b.text || "").join("") || "";
  if (!text) throw new Error("Il server non ha restituito una risposta");
  console.log("[PSC] Risposta AI:", text.slice(0, 500));
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Prova a trovare il JSON nella risposta
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    console.error("[PSC] Testo non parsabile:", text);
    throw new Error("L'AI non ha restituito un JSON valido. Riprova o semplifica i documenti caricati.");
  }
}


// ─── MERGE DATI: fonde nuovi dati estratti con quelli esistenti ──────────────
// Priorità: valore esistente se non null, altrimenti nuovo valore
function mergeDati(esistenti, nuovi) {
  if (!nuovi) return esistenti;
  if (!esistenti) return nuovi;

  function mergeOggetto(old, nuovo) {
    if (!nuovo) return old;
    if (!old) return nuovo;
    const result = { ...old };
    for (const [k, v] of Object.entries(nuovo)) {
      // Sovrascrivi solo se il campo era null/vuoto e il nuovo ha un valore
      if ((old[k] === null || old[k] === undefined || old[k] === "") && v) {
        result[k] = v;
      }
    }
    return result;
  }

  return {
    cantiere: mergeOggetto(esistenti.cantiere, nuovi.cantiere),
    committente: mergeOggetto(esistenti.committente, nuovi.committente),
    responsabile_lavori: mergeOggetto(esistenti.responsabile_lavori, nuovi.responsabile_lavori),
    progettista: mergeOggetto(esistenti.progettista, nuovi.progettista),
    direttore_lavori: mergeOggetto(esistenti.direttore_lavori, nuovi.direttore_lavori),
    csp: mergeOggetto(esistenti.csp, nuovi.csp),
    cse: mergeOggetto(esistenti.cse, nuovi.cse),
    impresa_appaltatrice: mergeOggetto(esistenti.impresa_appaltatrice, nuovi.impresa_appaltatrice),
    // Per i subappaltatori: aggiungi quelli nuovi non già presenti
    subappaltatori: (() => {
      const vecchi = esistenti.subappaltatori || [];
      const nuoviSub = nuovi.subappaltatori || [];
      const nomiEsistenti = new Set(vecchi.map(s => (s.ragione_sociale || "").toLowerCase()));
      const daAggiungere = nuoviSub.filter(s => s.ragione_sociale && !nomiEsistenti.has(s.ragione_sociale.toLowerCase()));
      return [...vecchi, ...daAggiungere];
    })(),
    lavorazioni: (() => {
      const vecchie = esistenti.lavorazioni || [];
      const nuoveLav = nuovi.lavorazioni || [];
      const descEsistenti = new Set(vecchie.map(l => (l.descrizione || "").toLowerCase()));
      const daAggiungere = nuoveLav.filter(l => l.descrizione && !descEsistenti.has(l.descrizione.toLowerCase()));
      return [...vecchie, ...daAggiungere];
    })(),
    morfologia_sito: esistenti.morfologia_sito || nuovi.morfologia_sito || null,
    note_organizzazione: esistenti.note_organizzazione || nuovi.note_organizzazione || null,
  };
}

// ─── GENERA TESTO PSC CON AI ──────────────────────────────────────────────────
async function generaPSCTesto(dati, tipoCantiere) {
  const tipoLabel = TIPI_CANTIERE.find(t => t.id === tipoCantiere)?.label || tipoCantiere;

  const prompt = `Sei un Coordinatore per la Sicurezza esperto. Devi redigere un Piano di Sicurezza e Coordinamento (PSC) completo ai sensi dell'art. 100 e Allegato XV del D.Lgs. 81/2008, per un cantiere di tipo "${tipoLabel}".

Dati del cantiere:
${JSON.stringify(dati, null, 2)}

Genera il PSC completo con TUTTI i seguenti capitoli. Per ogni sezione usa il testo appropriato, professionale e conforme alla normativa. Dove i dati sono null usa testo generico appropriato al tipo di cantiere.

STRUTTURA OBBLIGATORIA (rispetta esattamente questa struttura):

# PIANO DI SICUREZZA E DI COORDINAMENTO – D.Lgs. 81/2008
## [Descrizione breve cantiere]

## 0. FINALITÀ DEL DOCUMENTO
### 0.1. Generalità
[Testo standard sulla finalità del PSC, riferimento art. 100 D.Lgs. 81/2008]

## 1. RELAZIONE SULL'OPERA
### 1.1. Identificazione e descrizione dell'opera
#### 1.1.1. Indirizzo di cantiere
[TABELLA con tutti i dati identificativi del cantiere dai dati forniti]

#### 1.1.2. Descrizione del contesto in cui è collocata l'area di cantiere
##### 1.1.2.1. Morfologia del sito
[Descrizione del contesto fisico basata sui dati forniti e sul tipo di cantiere]

### 1.2. Soggetti coinvolti nel Piano di Sicurezza e Coordinamento
#### 1.2.1. Soggetti
[TABELLE con committente, responsabile lavori, progettista, direttore lavori, CSP, CSE]

#### 1.2.2. Impresa appaltatrice e subappaltatori
[TABELLE con impresa appaltatrice e tutte le imprese subappaltatrici numerate]

### 1.3. Descrizione degli interventi da realizzare
[Descrizione dettagliata delle lavorazioni previste basata sui dati forniti]

### 1.4. Organizzazione del cantiere
[Organizzazione specifica per il tipo di cantiere "${tipoLabel}"]

### 1.5. Fasi lavorative
#### 1.5.1. Fasi lavorative principali e particolari dell'opera
[TABELLA con fasi lavorative, lavorazione specifica, impresa che la esegue]

### 1.6. Programma lavori e coordinamento
[Riferimento al cronoprogramma e indicazioni di coordinamento temporale]

### 1.8. Notifica preliminare
[Riferimento all'obbligo di notifica preliminare ex art. 99 D.Lgs. 81/2008]

## 2. VALUTAZIONE DEI RISCHI DOVUTI ALLE CARATTERISTICHE DELL'OPERA
### 2.1. Criterio procedurale adottato per la valutazione del rischio
[Metodo R = P × D con scala 0-4 per probabilità e danno]

### 2.2. Tabella di valutazione dei rischi – lavorazioni
[Riferimento all'allegato Analisi Rischi]

### 2.3. Rischi specifici principali
[Descrizione dei rischi principali per il tipo di cantiere "${tipoLabel}" con misure preventive]

## 3. VALUTAZIONE DEI RISCHI DOVUTI AI VINCOLI DELL'AMBIENTE
### 3.1. Caratteristiche generali del sito
[Analisi del contesto esterno: viabilità, utenze, edifici adiacenti, specifico per tipo cantiere]

### 3.2. Impianti in esercizio esistenti sul cantiere
[Impianti presenti (elettrico, idrico, gas, ecc.) e misure di gestione]

## 4. MODALITÀ ORGANIZZATIVE DELLA COOPERAZIONE E DEL COORDINAMENTO
### 4.1. Individuazione delle sovrapposizioni
[Analisi delle interferenze tra le lavorazioni delle diverse imprese]

### 4.2. Cooperazione, coordinamento e reciproca informazione
[Modalità di cooperazione, riunioni di coordinamento, verbali]

## 5. SERVIZI LOGISTICI ED IGIENICO-ASSISTENZIALI
### 5.1. Servizi logistici ed igienico-assistenziali
[Bagni, spogliatoi, locale di riposo, primo soccorso]

### 5.2. Recinzione del cantiere, accessi e segnalazioni
[Recinzione, accessi, segnaletica specifica per tipo cantiere]

### 5.3. Gestione dei materiali di risulta
[Modalità di gestione e smaltimento rifiuti speciali e non]

## 6. SEGNALETICA DI CANTIERE
### 6.1. Segnaletica di cantiere – elenco e ubicazione
[Elenco cartelli obbligatori con quantità e ubicazione]

## 7. INDICAZIONI GENERALI MACCHINE, ATTREZZATURE ED IMPIANTI
### 7.1. Premesse
[Obblighi generali ex art. 71 D.Lgs. 81/2008]

### 7.2. Controllo preventivo delle macchine e dei mezzi d'opera
[Verifiche preventive, marcatura CE, libretti]

### 7.3. Attrezzature specifiche per il cantiere
[Attrezzature tipiche per "${tipoLabel}" con prescrizioni d'uso]

## 8. DISPOSITIVI DI PROTEZIONE INDIVIDUALE (D.P.I.)
[TABELLA con DPI obbligatori per ogni tipo di lavorazione prevista: elmetto, guanti, scarpe, imbracatura se necessario, ecc.]

## 9. SOSTANZE UTILIZZATE – PRODOTTI CHIMICI
### 9.1. Sostanze utilizzate e loro uso
[TABELLA con sostanze tipiche per "${tipoLabel}": vernici, colle, solventi, ecc. con indicazioni H, classificazione, DPI]

### 9.2. Norme generali sulla tenuta in deposito
[Norme di stoccaggio sicuro per prodotti chimici]

## 10. SORVEGLIANZA SANITARIA
### 10.1. Tipi di accertamenti
[TABELLA tipi di visita medica, periodicità, mansioni]

### 10.2. Valutazione dell'esposizione al rumore
[TABELLA lavorazioni, livelli Leq stimati, classe di esposizione, DPI per "${tipoLabel}"]

### 10.3. Movimentazione manuale dei carichi
[Limiti NIOSH, misure preventive]

### 10.4. Rischio vibrazioni
[TABELLA attrezzature, valori A(8), misure preventive per "${tipoLabel}"]

## 11. PROCEDURE DI EMERGENZA
### 11.1. Procedure di pronto soccorso
[Procedura standardizzata con indirizzo specifico del cantiere]

### 11.2. Procedure di evacuazione e antincendio
[Procedura evacuazione specifica per tipo cantiere]

### 11.3. Numeri telefonici di emergenza
[TABELLA con 112, ospedale più vicino, centro antiveleni, committente, CSE, impresa appaltatrice]

### 11.4. Cassetta di pronto soccorso – contenuto minimo
[TABELLA contenuto minimo D.M. 388/2003]

### 11.5. Come assistere l'infortunato
[TABELLA situazioni, azioni immediate, attenzioni]

## 12. STIMA DEI COSTI DELLA SICUREZZA
[TABELLA con voci di costo sicurezza tipiche per "${tipoLabel}", quantità stimate sulla durata lavori, prezzi indicativi. Nota: l'importo finale dovrà essere verificato dal CSE sul prezzario di riferimento territoriale. Totale indicativo]

## 13. DOCUMENTAZIONE DI CANTIERE
### 13.1. Elenco documenti da tenere in cantiere
[Elenco completo documentazione obbligatoria ex D.Lgs. 81/2008]

### 13.2. Riferimenti normativi
[TABELLA documenti, norma di riferimento, soggetto competente]

---
[Luogo e data: ${dati.cantiere?.comune || "___"}, ${new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}]

**Il Coordinatore per la Sicurezza in fase di Progettazione e di Esecuzione dei lavori**
${dati.cse?.nome || "___"}
${dati.cse?.studio || ""}
${dati.cse?.indirizzo || ""}

ISTRUZIONI IMPORTANTI:
- Usa tabelle Markdown (| col1 | col2 |) per tutte le sezioni tabellari
- Il documento deve essere COMPLETO e professionale, non usare placeholder come [da compilare]
- Dove mancano dati specifici usa formulazioni appropriate al tipo di cantiere
- Usa sempre il tono formale e tecnico di un documento ufficiale HSE
- Le sezioni normative (cap. 8, 9, 10, 11, 13) devono essere complete e dettagliate`;

  const response = await fetch("${API_URL}/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  return data.content?.map(b => b.text || "").join("") || "";
}


// ─── SOSTITUZIONE TESTO IN DOCX (gestisce run XML spezzati) ──────────────────
/**
 * Rimuove dall'XML DOCX gli elementi che Word usa per annotazioni interne
 * (spell-check markers, bookmark boundaries, ecc.) che spezzano il testo
 * su più run impedendo la sostituzione con semplice split/join.
 */
function normalizzaXmlDocx(xml) {
  return xml
    .replace(/<w:proofErr\b[^>]*\/>/g, '')
    .replace(/<w:bookmarkStart\b[^>]*\/>/g, '')
    .replace(/<w:bookmarkEnd\b[^>]*\/>/g, '')
    .replace(/<w:lastRenderedPageBreak\b[^>]*\/>/g, '');
}

/**
 * Sostituisce 'cerca' con 'sostituisci' nell'XML DOCX.
 * Tenta prima la sostituzione diretta; se non funziona (testo spezzato su
 * più <w:r>) usa una regex che ammette markup XML tra i caratteri del testo.
 *
 * Esempio: Word può scrivere "scala A" come:
 *   <w:r><w:t>scala </w:t></w:r><w:r><w:rPr>...</w:rPr><w:t>A</w:t></w:r>
 * La regex cattura entrambi i run e li sostituisce con un run unico.
 */
function sostituisciTestoInDocx(xml, cerca, sostituisci) {
  if (!cerca || !sostituisci) return xml;

  const sostiXml = sostituisci
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x2019;');

  // Tentativo 1: sostituzione diretta (caso ottimale)
  if (xml.includes(cerca)) {
    return xml.split(cerca).join(sostiXml);
  }

  // Tentativo 2: regex che matcha testo spezzato tra run adiacenti.
  // Tra ogni coppia di caratteri ammette opzionalmente la chiusura di un run
  // e l'apertura del successivo (con eventuale rPr).
  const RUN_BOUNDARY = String.raw`(?:</w:t></w:r>\s*(?:<w:r>|<w:r\b[^>]*>)(?:<w:rPr>[\s\S]*?</w:rPr>)?<w:t(?:\s[^>]*)?>)?`;
  const escaped = [...cerca].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.join(RUN_BOUNDARY);

  try {
    const regex = new RegExp(pattern, 'g');
    const nuovo = xml.replace(regex, (match) => {
      // Preserva l'rPr del primo run trovato nella match
      const rPrM = match.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
      const rPr = rPrM ? `<w:rPr>${rPrM[1]}</w:rPr>` : '';
      return `<w:r>${rPr}<w:t xml:space="preserve">${sostiXml}</w:t></w:r>`;
    });
    return nuovo;
  } catch {
    // Regex non valida (caratteri speciali imprevisti) → ritorna xml invariato
    return xml;
  }
}

// ─── GENERA DOCX DAL TEMPLATE (find-and-replace + sostituzione blocchi narrativi) ──
async function caricaJSZip() {
  if (window.JSZip) return window.JSZip;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
    s.onload = res;
    s.onerror = () => rej(new Error("Impossibile caricare JSZip da CDN"));
    document.head.appendChild(s);
  });
  return window.JSZip;
}

async function generaDocxDaTemplate(templateFile, sostituzioni, datiEstratti, tipoCantiere) {
  const Zip = await caricaJSZip();

  const arrayBuffer = await templateFile.arrayBuffer();
  const zip = await Zip.loadAsync(arrayBuffer);

  // ── 1. Leggi il document.xml ────────────────────────────────────────────────
  const docFile = zip.file("word/document.xml");
  let docXml = await docFile.async("string");

  // ── 2. Genera i testi narrativi con AI ──────────────────────────────────────
  const c = datiEstratti.cantiere || {};
  const comm = datiEstratti.committente || {};
  const app = datiEstratti.impresa_appaltatrice || {};
  const subs = datiEstratti.subappaltatori || [];
  const tipoLabel = TIPI_CANTIERE.find(t => t.id === tipoCantiere)?.label || "cantiere";

  // Costruisci lista lavorazioni dal check list estratto dall'AI (se disponibile)
  // Le lavorazioni estratte dal check list permettono una sezione 1.3 più accurata
  const lavStr = (datiEstratti.lavorazioni || [])
    .map(l => `• ${l.descrizione}${l.impresa ? ` (${l.impresa})` : ""}`)
    .join("\n") || "—";

  const promptNarrativi = `Sei un CSE (Coordinatore Sicurezza Esecuzione). Genera SOLO i seguenti testi per un PSC, in italiano formale tecnico. Rispondi SOLO con JSON valido.

Dati cantiere:
- Tipo: ${tipoLabel}
- Indirizzo: ${c.indirizzo || "—"} ${c.civico || ""}, ${c.comune || "—"}
- Unità: scala ${c.scala || "—"}, interno ${c.interno || "—"}, piano ${c.piano || "—"}°
- Superficie: ${c.superficie_mq || "—"} m²
- Anno costruzione: ${c.anno_costruzione || "—"}
- Descrizione intervento: ${c.descrizione || "—"}
- Committente: ${comm.ragione_sociale || "—"}
- Impresa appaltatrice: ${app.ragione_sociale || "—"}
- Subappaltatori: ${subs.map(s => s.specializzazione + ": " + s.ragione_sociale).join("; ") || "—"}
- Lavorazioni previste (da check list):
${lavStr}

Genera:
{
  "morfologia": "3-4 frasi che descrivono il contesto fisico del cantiere (tipo edificio, piano specifico, parti comuni, accesso) specifiche per questo cantiere. NON menzionare altri cantieri o unità di esempio.",
  "organizzazione": "3-4 frasi sull'organizzazione del cantiere (aree di lavoro, protezione parti comuni, stoccaggio materiali, comunicazione condòmini). Usa i nomi reali delle imprese.",
  "descrizione_interventi": "Paragrafo narrativo di 5-8 frasi che descrive in dettaglio tutti gli interventi previsti da realizzare, basato sulle lavorazioni elencate sopra. Usa linguaggio tecnico PSC professionale. Se le lavorazioni sono —, usa la descrizione intervento generale.",
  "sezione_foto": "Una frase che introduce la documentazione fotografica dello stato di fatto per questo specifico cantiere (unità ${c.codice_ui || c.codice_edificio || ""}). NON includere descrizioni di foto specifiche.",
  "nota_notifica": "Una frase standard sulla notifica preliminare ex art. 99 D.Lgs. 81/08 per questo cantiere."
}`;

  let narrativi = {};
  try {
    const resp = await fetch("${API_URL}/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: promptNarrativi }],
      }),
    });
    const rdata = await resp.json();
    const rtext = rdata.content?.map(b => b.text || "").join("") || "";
    narrativi = JSON.parse(rtext.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.warn("Narrativi AI falliti, uso placeholder:", e);
    narrativi = {
      morfologia: `L'unità immobiliare oggetto dei lavori è ubicata in ${c.comune || "comune non specificato"}, ${c.indirizzo || ""} ${c.civico || ""}, al piano ${c.piano || "—"}° (scala ${c.scala || "—"}, interno ${c.interno || "—"}). L'edificio è di tipo condominiale; l'accesso al cantiere avverrà attraverso le parti comuni che resteranno in normale esercizio.`,
      organizzazione: `L'area di cantiere coincide con il volume interno dell'alloggio. Le parti comuni saranno protette mediante teli e segnaletica. Il coordinamento delle imprese sarà curato dall'impresa appaltatrice ${app.ragione_sociale || "—"}.`,
      descrizione_interventi: (datiEstratti.lavorazioni || []).length > 0
        ? `L'intervento prevede le seguenti lavorazioni: ${(datiEstratti.lavorazioni || []).map(l => l.descrizione).join("; ")}.`
        : `L'intervento riguarda ${c.descrizione || "lavori di manutenzione ordinaria e straordinaria"} dell'unità immobiliare al piano ${c.piano || "—"}° (scala ${c.scala || "—"}, interno ${c.interno || "—"}).`,
      sezione_foto: `Di seguito si riportano le fotografie dello stato di fatto dell'unità immobiliare ${c.codice_ui || c.codice_edificio || ""}.`,
      nota_notifica: "La notifica preliminare è stata trasmessa all'organo di vigilanza competente ai sensi dell'art. 99 del D.Lgs. 81/2008 prima dell'inizio dei lavori.",
    };
  }

  // ── 3. Funzione: costruisci un paragrafo XML con stile "Normal" ────────────
  function testoAParagrafoXml(testo) {
    const escaped = testo
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x2019;");
    return `<w:p><w:pPr><w:jc w:val="both"/></w:pPr><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
  }

  // ── 4. Sostituisci blocchi narrativi ────────────────────────────────────────

  // Morfologia del sito: trova e sostituisci il blocco
  const morfoStart = "L&#x2019;unità immobiliare oggetto dei lavori è un appartamento situato";
  const morfoEnd = "1.2. SOGGETTI";
  if (docXml.includes(morfoStart)) {
    const idxMS = docXml.indexOf(morfoStart);
    const paraStart = docXml.lastIndexOf('<w:p ', idxMS);
    const idxME = docXml.indexOf(morfoEnd);
    const paraEnd = docXml.lastIndexOf('</w:p>', idxME) + '</w:p>'.length;
    const nuovoBlocco = testoAParagrafoXml(narrativi.morfologia);
    docXml = docXml.slice(0, paraStart) + nuovoBlocco + docXml.slice(paraEnd);
  }

  // Sezione 1.3 DESCRIZIONE INTERVENTI: sostituisci con testo generato da check list
  // Cerca il blocco tra il titolo 1.3 e il titolo 1.4 nel template
  const desc13Start = "DESCRIZIONE DEGLI INTERVENTI";
  const desc13End = "1.4";
  if (docXml.includes(desc13Start) && narrativi.descrizione_interventi) {
    const idxD13S = docXml.indexOf(desc13Start);
    // Trova il paragrafo che segue il titolo (skip il titolo stesso)
    const afterTitle = docXml.indexOf('</w:p>', idxD13S) + '</w:p>'.length;
    const paraAfterTitle = docXml.indexOf('<w:p', afterTitle);
    const idxD13E = docXml.indexOf(desc13End, idxD13S + desc13Start.length);
    const paraEnd13 = idxD13E > -1 ? docXml.lastIndexOf('</w:p>', idxD13E) + '</w:p>'.length : -1;
    if (paraAfterTitle > -1 && paraEnd13 > paraAfterTitle) {
      const nuovoBlocco13 = testoAParagrafoXml(narrativi.descrizione_interventi);
      docXml = docXml.slice(0, paraAfterTitle) + nuovoBlocco13 + docXml.slice(paraEnd13);
    }
  }

  // Organizzazione cantiere: trova e sostituisci
  const orgStart = "L&#x2019;organizzazione del cantiere è strettamente";
  const orgEnd = "1.5. FASI LAVORATIVE";
  if (docXml.includes(orgStart)) {
    const idxOS = docXml.indexOf(orgStart);
    const paraStart = docXml.lastIndexOf('<w:p ', idxOS);
    const idxOE = docXml.indexOf(orgEnd);
    const paraEnd = docXml.lastIndexOf('</w:p>', idxOE) + '</w:p>'.length;
    const nuovoBlocco = testoAParagrafoXml(narrativi.organizzazione);
    docXml = docXml.slice(0, paraStart) + nuovoBlocco + docXml.slice(paraEnd);
  }

  // Sezione fotografica: sostituisci il contenuto con il solo testo introduttivo
  const fotoStart = "Di seguito si riporta una selezione";
  const fotoEnd = "1.8. NOTIFICA PRELIMINARE";
  if (docXml.includes(fotoStart)) {
    const idxFS = docXml.indexOf(fotoStart);
    const paraStart = docXml.lastIndexOf('<w:p ', idxFS);
    const idxFE = docXml.indexOf(fotoEnd);
    const paraEnd = docXml.lastIndexOf('</w:p>', idxFE) + '</w:p>'.length;
    const nuovoBlocco = testoAParagrafoXml(narrativi.sezione_foto) +
      testoAParagrafoXml("[Inserire documentazione fotografica dello stato di fatto]");
    docXml = docXml.slice(0, paraStart) + nuovoBlocco + docXml.slice(paraEnd);
  }

  // ── 5. Normalizza l'XML (rimuove marker che spezzano i run) ────────────────
  docXml = normalizzaXmlDocx(docXml);

  // ── 6. Applica find-and-replace per tutti i valori tabellarizzati ───────────
  // Usa sostituisciTestoInDocx() che gestisce il testo spezzato su più run XML
  for (const [vecchio, nuovo] of Object.entries(sostituzioni)) {
    docXml = sostituisciTestoInDocx(docXml, vecchio, nuovo);
  }

  zip.file("word/document.xml", docXml);

  // ── 7. Applica sostituzioni anche a header e footer ─────────────────────────
  for (const filePath of ["word/header1.xml", "word/header2.xml", "word/footer1.xml", "word/footer2.xml"]) {
    const file = zip.file(filePath);
    if (!file) continue;
    let xml = normalizzaXmlDocx(await file.async("string"));
    for (const [vecchio, nuovo] of Object.entries(sostituzioni)) {
      xml = sostituisciTestoInDocx(xml, vecchio, nuovo);
    }
    zip.file(filePath, xml);
  }

  // ── 8. Genera e sostituisci il cartiglio (image1.png = frontespizio) ─────────
  try {
    const rispCartiglio = await fetch("${API_URL}/api/genera-cartiglio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datiEstratti),
    });
    if (rispCartiglio.ok) {
      const { png_base64 } = await rispCartiglio.json();
      if (png_base64) {
        // Converte base64 in Uint8Array e sostituisce image1.png nel DOCX
        const binStr = atob(png_base64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        zip.file("word/media/image1.png", bytes);
        console.log("[PSC] Cartiglio sostituito con successo");
      }
    } else {
      console.warn("[PSC] Endpoint cartiglio non disponibile, frontespizio invariato");
    }
  } catch (e) {
    console.warn("[PSC] Generazione cartiglio fallita:", e.message, "— frontespizio invariato");
  }

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return blob;
}

// ─── COSTRUISCE LA MAPPA DI SOSTITUZIONI dai dati estratti ───────────────────
function costruisciSostituzioni(datiEstratti, testoAI) {
  const d = datiEstratti;
  const c = d.cantiere || {};
  const comm = d.committente || {};
  const cse = d.cse || {};
  const csp = d.csp || {};
  const rl = d.responsabile_lavori || {};
  const prog = d.progettista || {};
  const dl = d.direttore_lavori || {};
  const app = d.impresa_appaltatrice || {};

  // Formato data italiano leggibile
  function fmtData(dataStr) {
    if (!dataStr) return "";
    const parts = dataStr.split("/");
    if (parts.length !== 3) return dataStr;
    const mesi = ["gennaio","febbraio","marzo","aprile","maggio","giugno",
                  "luglio","agosto","settembre","ottobre","novembre","dicembre"];
    return `${parseInt(parts[0])} ${mesi[parseInt(parts[1])-1]} ${parts[2]}`;
  }

  // Costruisci stringa imprese subappaltatrici per header
  const nSub = (d.subappaltatori || []).length;
  const nImprese = c.n_imprese || (nSub > 0 ? `${nSub+1} (1 appaltatrice + ${nSub} subappaltatrici)` : "1");

  // Stringa breve per header (cantiere – committente – indirizzo)
  const headerCantiere = [
    c.descrizione || "",
    comm.ragione_sociale ? `– ${comm.ragione_sociale}` : "",
    c.indirizzo ? `– ${c.indirizzo}` : "",
    c.comune ? `, ${c.comune}` : "",
  ].filter(Boolean).join(" ").trim();

  // Stringa titolo documento (riga sotto il titolo principale nell'header)
  const headerSottotitolo = `${c.descrizione || ""} – ${comm.ragione_sociale || ""} – ${c.indirizzo || ""}, ${c.comune || ""}`.trim();

  // Studio CSE per footer
  const footerCSE = [
    cse.studio || csp.studio || "",
    cse.indirizzo || csp.indirizzo || "",
  ].filter(Boolean).join(" – ");

  return {
    // ── Codice UI / identificativo cantiere ────────────────────────────────
    "UI_43103914": c.codice_ui || c.codice_edificio || "—",

    // ── Titolo documento (riga descrittiva nell'intestazione) ──────────────
    "Manutenzione ordinaria e straordinaria – ITEA UI_43103914 – Via Doss Trento 45/1, Trento":
      headerSottotitolo || headerCantiere,

    // ── Titolo body (cap. 0) ───────────────────────────────────────────────
    "LAVORI DI MANUTENZIONE ORDINARIA E STRAORDINARIA DEGLI IMMOBILI ITEA S.p.A.":
      (c.descrizione || "").toUpperCase(),
    "Unità immobiliare UI_43103914 – Comune di Trento – Via Doss Trento 45/1 – scala A – interno 23 – piano 5°":
      [c.codice_ui, c.comune, c.indirizzo, c.scala ? `scala ${c.scala}` : null,
       c.interno ? `interno ${c.interno}` : null, c.piano ? `piano ${c.piano}` : null]
      .filter(Boolean).join(" – ") || c.descrizione || "—",

    // ── Tabella indirizzo cantiere ─────────────────────────────────────────
    "Lavori di manutenzione ordinaria e straordinaria degli immobili ITEA S.p.A.":
      c.descrizione || "—",
    "Comune di TRENTO – loc. Doss Trento":
      c.comune ? `Comune di ${c.comune.toUpperCase()}` : "—",
    // Varianti indirizzo: dalla più specifica alla più generica
    // (body text può avere "via" minuscola — deve essere sostituita prima di "Via")
    "via Doss Trento 45/1": c.indirizzo ? `via ${c.indirizzo} ${c.civico || ""}`.trim() : "—",
    "Via Doss Trento 45/1": c.indirizzo ? `Via ${c.indirizzo} ${c.civico || ""}`.trim() : "—",
    "Via Doss Trento": c.indirizzo || "—",
    "45/1": c.civico || "",
    "5620": c.particella || "—",
    "99,81 m²": c.superficie_mq ? `${c.superficie_mq} m²` : "—",
    "1983": c.anno_costruzione || "—",
    "8 giugno 2026": c.data_inizio ? fmtData(c.data_inizio) : "—",
    "4 mesi": c.durata_mesi ? `${c.durata_mesi} mesi` : "—",
    "€ 17.534,71": c.importo_cme ? `€ ${parseFloat(c.importo_cme).toLocaleString("it-IT", {minimumFractionDigits:2})}` : "—",
    "7 (1 appaltatrice + 6 subappaltatrici)": String(nImprese),

    // ── Committente ────────────────────────────────────────────────────────
    "ITEA S.p.A.": comm.ragione_sociale || "—",
    "Via R. Guardini, 22 – 38121 TRENTO": comm.indirizzo || "—",
    "0461 803111 – Fax 0461 827989":
      [comm.telefono, comm.fax ? `Fax ${comm.fax}` : null].filter(Boolean).join(" – ") || "—",

    // ── Figure (telefono generico committente) ─────────────────────────────
    "0461 803111": comm.telefono || rl.telefono || "—",

    // ── Responsabile lavori ────────────────────────────────────────────────
    "ing. Domenico Buttafuoco – ITEA S.p.A.":
      rl.nome ? `${rl.nome}${rl.azienda ? " – " + rl.azienda : ""}` : "—",

    // ── Progettista / DL ───────────────────────────────────────────────────
    "ing. Miriam Donini – ITEA S.p.A.":
      prog.nome ? `${prog.nome}${prog.azienda ? " – " + prog.azienda : ""}` : "—",

    // ── CSP / CSE ──────────────────────────────────────────────────────────
    "ing. Marco Zanuso": cse.nome || csp.nome || "—",
    "Ordine degli Ingegneri della Prov. di Trento – Sez. A n. 1244":
      cse.ordine || csp.ordine || "—",

    // ── Footer studio CSE ──────────────────────────────────────────────────
    "Studio Tecnico ing. Marco Zanuso – Via alla Val, 61 – 38123 Trento, fr. Povo":
      footerCSE || cse.nome || "—",

    // ── Dati specifici appartamento nel testo narrativo ─────────────────────
    // NOTA: ordine importante — le stringhe più lunghe prima di quelle più corte
    // per evitare sostituzioni parziali che lasciano residui nel testo.
    "scala A, interno 23": [c.scala ? `scala ${c.scala}` : null, c.interno ? `interno ${c.interno}` : null].filter(Boolean).join(", ") || "—",
    "interno 23": c.interno ? `interno ${c.interno}` : "—",
    // Fix: includere ° nel risultato (era: `piano ${c.piano}` — mancava il °)
    "al 5° piano": c.piano ? `al ${c.piano}° piano` : "—",
    "5° piano": c.piano ? `${c.piano}° piano` : "—",
    "piano 5°": c.piano ? `piano ${c.piano}°` : "—",
    // Fallback per celle tabella che contengono solo il valore "5°" (senza la parola "piano")
    "5°": c.piano ? `${c.piano}°` : "—",

    // ── Nomi imprese del template ────────────────────────────────────────────
    "Basso geom. Luigi S.r.l.": app.ragione_sociale || "—",
    "Basso geom. Luigi S.r.l": app.ragione_sociale || "—",
    "Basso geom": app.ragione_sociale ? app.ragione_sociale.split(" ").slice(0,3).join(" ") : "—",
    "Ecoopera Soc. Coop.": (() => {
      const subs = d.subappaltatori || [];
      return subs.find(s => /rifiut|smaltim|ecoop/i.test(s.specializzazione || ""))?.ragione_sociale || subs.at(-1)?.ragione_sociale || "—";
    })(),
    "AP Elettrica di Alberto Pecoraro e C. S.n.c.": (() => {
      const subs = d.subappaltatori || [];
      return subs.find(s => /elettr/i.test(s.specializzazione || ""))?.ragione_sociale || subs[0]?.ragione_sociale || "—";
    })(),
    "Schmid Termosanitari S.r.l.": (() => {
      const subs = d.subappaltatori || [];
      return subs.find(s => /idraul|termosanit|termoidraul/i.test(s.specializzazione || ""))?.ragione_sociale || subs[1]?.ragione_sociale || "—";
    })(),
    "Trentina Decor di Kojdhelaj Florjan": (() => {
      const subs = d.subappaltatori || [];
      return subs.find(s => /pittur|tintegg|cartong|decor/i.test(s.specializzazione || ""))?.ragione_sociale || subs[2]?.ragione_sociale || "—";
    })(),
    "DOMUS bauexpert di bauexpert S.p.A": (() => {
      const subs = d.subappaltatori || [];
      return subs.find(s => /pav|ceramica|legno/i.test(s.specializzazione || ""))?.ragione_sociale || subs[3]?.ragione_sociale || "—";
    })(),
    "DOMUS bauexpert": (() => {
      const subs = d.subappaltatori || [];
      return subs.find(s => /pav|ceramica|legno/i.test(s.specializzazione || ""))?.ragione_sociale || subs[3]?.ragione_sociale || "—";
    })(),
    "F.MERZ S.r.l.": (() => {
      const subs = d.subappaltatori || [];
      return subs.find(s => /legno|parquet|merz/i.test(s.specializzazione || "") || /legno|parquet/i.test(s.ragione_sociale || ""))?.ragione_sociale || subs[4]?.ragione_sociale || "—";
    })(),

    // ── ITEA nel testo narrativo ─────────────────────────────────────────────
    "ITEA S.p.A.": comm.ragione_sociale || "—",
    // "ITEA" da solo è troppo generico — non sostituiamo per evitare falsi positivi
  };
}

// ─── GENERA DOCX dal testo markdown (fallback senza template) ─────────────────
async function generaDocx(testoMarkdown, datiCantiere) {
  // Usa la libreria docx via CDN (già installata nel progetto)
  // Converte il markdown in struttura docx
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
    Footer, Header, LevelFormat, SimpleField } = await import("docx");

  const linee = testoMarkdown.split("\n");
  const children = [];
  let inTabella = false;
  let righeTabella = [];
  let inElenco = false;

  const borderCella = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  };

  function flushTabella() {
    if (righeTabella.length === 0) return;
    const colWidths = [];
    const nCols = (righeTabella[0] || []).length;
    const totW = 9360;
    const cW = Math.floor(totW / Math.max(nCols, 1));
    for (let i = 0; i < nCols; i++) colWidths.push(cW);

    const rows = righeTabella.map((row, ri) => {
      const isHeader = ri === 0;
      return new TableRow({
        children: row.map(cella => new TableCell({
          borders: borderCella,
          width: { size: cW, type: WidthType.DXA },
          shading: isHeader ? { fill: "1E3A5F", type: ShadingType.CLEAR } : { fill: "F8FAFC", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [new Paragraph({
            children: [new TextRun({
              text: cella.trim().replace(/\*\*/g, ""),
              bold: isHeader,
              color: isHeader ? "FFFFFF" : "1A2B3C",
              size: isHeader ? 18 : 18,
              font: "Calibri",
            })],
          })],
        })),
      });
    });

    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: colWidths,
      rows,
      margins: { top: 100, bottom: 100 },
    }));
    children.push(new Paragraph({ text: "" }));
    righeTabella = [];
    inTabella = false;
  }

  function parsaInlineBold(testo) {
    const runs = [];
    const re = /\*\*(.+?)\*\*/g;
    let last = 0, m;
    while ((m = re.exec(testo)) !== null) {
      if (m.index > last) runs.push(new TextRun({ text: testo.slice(last, m.index), font: "Calibri", size: 22 }));
      runs.push(new TextRun({ text: m[1], bold: true, font: "Calibri", size: 22 }));
      last = re.lastIndex;
    }
    if (last < testo.length) runs.push(new TextRun({ text: testo.slice(last), font: "Calibri", size: 22 }));
    return runs.length ? runs : [new TextRun({ text: testo, font: "Calibri", size: 22 })];
  }

  for (const linea of linee) {
    const trim = linea.trim();

    // Riga tabella markdown
    if (trim.startsWith("|")) {
      const colonne = trim.split("|").slice(1, -1);
      if (colonne.every(c => /^[-:\s]+$/.test(c))) continue; // riga separatore
      if (!inTabella) inTabella = true;
      righeTabella.push(colonne);
      continue;
    } else if (inTabella) {
      flushTabella();
    }

    // Titoli
    if (trim.startsWith("# ")) {
      children.push(new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: trim.slice(2), bold: true, font: "Calibri", size: 36, color: "1E3A5F" })],
        spacing: { before: 400, after: 200 },
      }));
    } else if (trim.startsWith("## ")) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: trim.slice(3), bold: true, font: "Calibri", size: 28, color: "1E3A5F" })],
        spacing: { before: 360, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "3B82F6", space: 4 } },
      }));
    } else if (trim.startsWith("### ")) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: trim.slice(4), bold: true, font: "Calibri", size: 24, color: "2C5282" })],
        spacing: { before: 280, after: 120 },
      }));
    } else if (trim.startsWith("#### ")) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: trim.slice(5), bold: true, font: "Calibri", size: 22, color: "2D3748" })],
        spacing: { before: 200, after: 80 },
      }));
    } else if (trim.startsWith("##### ")) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_4,
        children: [new TextRun({ text: trim.slice(6), bold: true, font: "Calibri", size: 22, color: "4A5568" })],
        spacing: { before: 160, after: 60 },
      }));
    } else if (trim.startsWith("---")) {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E0", space: 4 } },
        spacing: { before: 200, after: 200 },
        children: [],
      }));
    } else if (trim.startsWith("- ") || trim.startsWith("• ")) {
      children.push(new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: parsaInlineBold(trim.slice(2)),
        spacing: { before: 40, after: 40 },
      }));
    } else if (/^\d+\.\s/.test(trim)) {
      children.push(new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: parsaInlineBold(trim.replace(/^\d+\.\s/, "")),
        spacing: { before: 40, after: 40 },
      }));
    } else if (trim === "") {
      children.push(new Paragraph({ children: [], spacing: { before: 60, after: 60 } }));
    } else {
      children.push(new Paragraph({
        children: parsaInlineBold(trim),
        spacing: { before: 80, after: 80 },
        alignment: AlignmentType.JUSTIFIED,
      }));
    }
  }

  if (inTabella) flushTabella();

  const nomeCantiere = datiCantiere?.cantiere?.descrizione || "Cantiere";
  const nomeCSE = datiCantiere?.cse?.nome || "Il Coordinatore";

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
        {
          reference: "numbers",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "1A2B3C" } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: `PSC — ${nomeCantiere}`, font: "Calibri", size: 18, color: "64748B" }),
              new TextRun({ text: "\t\t", font: "Calibri", size: 18 }),
              new TextRun({ text: "D.Lgs. 81/2008 — Allegato XV", font: "Calibri", size: 18, color: "64748B" }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E0", space: 4 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: nomeCSE, font: "Calibri", size: 16, color: "94A3B8" }),
              new TextRun({ text: "\t\tPag. ", font: "Calibri", size: 16, color: "94A3B8" }),
              new TextRun({ children: [new SimpleField("PAGE")], font: "Calibri", size: 16, color: "64748B" }),
            ],
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E0", space: 4 } },
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
function StepIndicator({ step, totale }) {
  const steps = ["Template", "Tipo cantiere", "Documenti", "Verifica dati", "Genera PSC"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i < step ? "#10b981" : i === step ? "#3b82f6" : "#1e2535",
              border: `2px solid ${i < step ? "#10b981" : i === step ? "#3b82f6" : "#334155"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800,
              color: i <= step ? "white" : "#475569",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i === step ? "#60a5fa" : i < step ? "#10b981" : "#475569", fontWeight: i === step ? 700 : 400, whiteSpace: "nowrap" }}>
              {s}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? "#10b981" : "#1e2535", margin: "0 8px", marginBottom: 22 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── COMPONENTE PRINCIPALE ────────────────────────────────────────────────────
export default function ModuloPSC({ azienda }) {
  const [step, setStep] = useState(0);
  const [tipoCantiere, setTipoCantiere] = useState(null);
  const [files, setFiles] = useState([]);
  const [usaDatiSafetyAI, setUsaDatiSafetyAI] = useState(false);
  const [datiEstratti, setDatiEstratti] = useState(null);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState(null);
  const [generazione, setGenerazione] = useState(false);
  const [templateFile, setTemplateFile] = useState(null);
  const [dragTemplate, setDragTemplate] = useState(false);
  const [filesAggiuntivi, setFilesAggiuntivi] = useState([]);
  const [dragAggiuntivo, setDragAggiuntivo] = useState(false);
  const [analisiAggiuntiva, setAnalisiAggiuntiva] = useState(false);
  const [msgAggiuntivo, setMsgAggiuntivo] = useState(null);
  const [generato, setGenerato] = useState(false);
  const [progressoMsg, setProgressoMsg] = useState("");

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.type === "application/pdf" ||
      f.name.endsWith(".docx") || f.name.endsWith(".doc") ||
      f.type.startsWith("image/")
    );
    setFiles(prev => {
      const nomi = new Set(prev.map(f => f.name));
      return [...prev, ...dropped.filter(f => !nomi.has(f.name))];
    });
  }, []);

  const handleFileInput = (e) => {
    const nuovi = Array.from(e.target.files).filter(f =>
      f.type === "application/pdf" || f.name.endsWith(".docx") ||
      f.name.endsWith(".doc") || f.type.startsWith("image/")
    );
    setFiles(prev => {
      const nomi = new Set(prev.map(f => f.name));
      return [...prev, ...nuovi.filter(f => !nomi.has(f.name))];
    });
  };

  // ── Step 2 → 3: Estrai dati ────────────────────────────────────────────────
  async function handleEstraiDati() {
    if (files.length === 0 && !usaDatiSafetyAI) {
      setErrore("Carica almeno un documento oppure usa i dati già presenti in SafetyAI.");
      return;
    }
    setCaricamento(true);
    setErrore(null);
    setProgressoMsg("Analisi documenti in corso…");

    try {
      let dati = {};

      // Se ci sono file, estrai da essi
      if (files.length > 0) {
        dati = await estraiDatiDaDocumenti(files);
      }

      // Se usa dati SafetyAI, integra con i dati dell'azienda attiva
      if (usaDatiSafetyAI && azienda) {
        const appaltoAttivo = azienda.appalti?.[0];
        const appaltatore = appaltoAttivo?.appaltatori?.[0];

        // Integra i dati SafetyAI dove quelli estratti sono null
        if (!dati.committente?.ragione_sociale) {
          dati.committente = { ragione_sociale: azienda.nome, indirizzo: azienda.sede || null, telefono: null, email: null, pec: null };
        }
        if (!dati.cantiere?.descrizione && appaltoAttivo) {
          dati.cantiere = { ...dati.cantiere, descrizione: appaltoAttivo.titolo, indirizzo: appaltoAttivo.area };
        }
        if (!dati.impresa_appaltatrice?.ragione_sociale && appaltatore) {
          dati.impresa_appaltatrice = {
            ragione_sociale: appaltatore.nome, indirizzo: null,
            telefono: appaltatore.telefono || null, email: appaltatore.email || null, pec: null,
          };
        }
        if ((!dati.subappaltatori || dati.subappaltatori.length === 0) && appaltoAttivo?.appaltatori?.length > 1) {
          dati.subappaltatori = appaltoAttivo.appaltatori.slice(1).map((app, i) => ({
            numero: String(i + 1).padStart(2, "0"),
            ragione_sociale: app.nome,
            specializzazione: null,
            indirizzo: null,
            telefono: app.telefono || null,
            email: app.email || null,
            pec: null,
          }));
        }
      }

      setDatiEstratti(dati);
      setStep(3);
    } catch (e) {
      setErrore("Errore durante l'analisi: " + e.message);
    } finally {
      setCaricamento(false);
      setProgressoMsg("");
    }
  }


  // ── Aggiungi documenti nello step 2 ───────────────────────────────────────
  async function handleAggiungiDocumenti() {
    if (filesAggiuntivi.length === 0) return;
    setAnalisiAggiuntiva(true);
    setMsgAggiuntivo(null);
    try {
      const nuoviDati = await estraiDatiDaDocumenti(filesAggiuntivi);
      const merged = mergeDati(datiEstratti, nuoviDati);
      setDatiEstratti(merged);
      setFilesAggiuntivi([]);
      // Conta quanti campi sono stati compilati
      const campiNuovi = Object.values(nuoviDati).filter(v =>
        v && typeof v === "object" && !Array.isArray(v) &&
        Object.values(v).some(x => x !== null && x !== undefined && x !== "")
      ).length;
      setMsgAggiuntivo({ tipo: "ok", testo: `Dati aggiornati — ${campiNuovi} sezioni integrate dai nuovi documenti` });
    } catch (e) {
      setMsgAggiuntivo({ tipo: "errore", testo: "Errore analisi: " + e.message });
    } finally {
      setAnalisiAggiuntiva(false);
    }
  }

  // ── Step 3 → 4: Genera PSC ─────────────────────────────────────────────────
  async function handleGeneraPSC() {
    setGenerazione(true);
    setErrore(null);
    setProgressoMsg("Generazione PSC in corso… (1-2 minuti)");

    try {
      const tipoLabel = TIPI_CANTIERE.find(t => t.id === tipoCantiere)?.label.replace(/\s/g, "_") || "PSC";
      const dataOggi = new Date().toLocaleDateString("it-IT").replace(/\//g, "-");
      let blob;

      if (templateFile) {
        // ── Approccio 1: usa il template DOCX caricato dal CSE ──────────────
        setProgressoMsg("Personalizzazione template con i dati del cantiere…");
        // Genera il testo AI per le sezioni descrittive (morfologia, interventi, ecc.)
        // e lo inserisce nella mappa di sostituzioni per i paragrafi lunghi
        const sostituzioni = costruisciSostituzioni(datiEstratti);
        blob = await generaDocxDaTemplate(templateFile, sostituzioni, datiEstratti, tipoCantiere);
      } else {
        // ── Approccio 2: genera da zero (fallback senza template) ────────────
        setProgressoMsg("Redazione capitoli PSC…");
        const testo = await generaPSCTesto(datiEstratti, tipoCantiere);
        setProgressoMsg("Generazione documento Word…");
        blob = await generaDocx(testo, datiEstratti);
      }

      // Scarica
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PSC_${tipoLabel}_${dataOggi}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerato(true);
      setStep(4);
    } catch (e) {
      setErrore("Errore durante la generazione: " + e.message);
    } finally {
      setGenerazione(false);
      setProgressoMsg("");
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    setStep(0); setTipoCantiere(null); setFiles([]); setDatiEstratti(null);
    setErrore(null); setGenerato(false); setUsaDatiSafetyAI(false); setTemplateFile(null);
  }

  // ── Rendering ──────────────────────────────────────────────────────────────
  const s = { fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" };

  return (
    <div style={s}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
          Generatore PSC
        </div>
        <div style={{ fontSize: 13, color: "#475569" }}>
          Piano di Sicurezza e Coordinamento — D.Lgs. 81/2008 Allegato XV
        </div>
      </div>

      <StepIndicator step={step} totale={4} />

      {errore && (
        <div style={{ padding: "12px 16px", marginBottom: 20, background: "#ef444415", border: "1px solid #ef444430", borderRadius: 10, fontSize: 13, color: "#fca5a5" }}>
          ⚠️ {errore}
        </div>
      )}

            {/* ── STEP 0: Carica template DOCX ───────────────────────────────────── */}
      {step === 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
            Carica il tuo template PSC
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
            Carica il tuo PSC di esempio in formato DOCX. L&#x27;app manterrà esattamente il tuo stile — font, frontespizio, intestazioni — e sostituirà solo i dati del cantiere.
          </div>

          {/* Drop zone template */}
          <div
            onDragOver={e => { e.preventDefault(); setDragTemplate(true); }}
            onDragLeave={() => setDragTemplate(false)}
            onDrop={e => {
              e.preventDefault(); setDragTemplate(false);
              const f = Array.from(e.dataTransfer.files).find(f => f.name.endsWith(".docx") || f.name.endsWith(".doc"));
              if (f) setTemplateFile(f);
            }}
            onClick={() => document.getElementById("psc-template-input").click()}
            style={{
              border: `2px dashed ${dragTemplate ? "#3b82f6" : templateFile ? "#10b981" : "#1e2535"}`,
              borderRadius: 12, padding: "40px 32px", textAlign: "center",
              background: dragTemplate ? "#1e3a5f10" : templateFile ? "#10b98108" : "#161b27",
              cursor: "pointer", transition: "all .15s", marginBottom: 16,
            }}>
            {templateFile ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 6 }}>
                  Template caricato
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{templateFile.name}</div>
                <button
                  onClick={e => { e.stopPropagation(); setTemplateFile(null); }}
                  style={{ marginTop: 12, padding: "6px 14px", background: "#1e2535", border: "1px solid #334155", borderRadius: 7, color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                  Rimuovi
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                  Trascina qui il tuo PSC di esempio (.docx)
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>oppure clicca per selezionare</div>
              </>
            )}
            <input
              id="psc-template-input" type="file" accept=".docx,.doc"
              onChange={e => { if (e.target.files[0]) setTemplateFile(e.target.files[0]); }}
              style={{ display: "none" }}
            />
          </div>

          {/* Info su cosa viene sostituito */}
          <div style={{ padding: "14px 18px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 10, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>
              Cosa viene sostituito automaticamente:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: "#64748b" }}>
              {["Indirizzo e dati identificativi cantiere", "Nome committente e contatti",
                "Coordinatore sicurezza (CSP/CSE)", "Impresa appaltatrice e subappaltatrici",
                "Date di inizio e durata lavori", "Importo lavori (CME)",
                "Intestazione documento", "Piè di pagina con studio professionale"].map((v, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: "#10b981" }}>✓</span> {v}
                </div>
              ))}
            </div>
          </div>

          {/* Opzione senza template */}
          <div style={{ padding: "12px 16px", background: "#0f1117", border: "1px dashed #1e2535", borderRadius: 8, marginBottom: 24, fontSize: 12, color: "#475569" }}>
            💡 Non hai un template? Puoi procedere senza — l&#x27;app genererà il PSC con uno stile di default.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                border: "none", borderRadius: 10, color: "white",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
              {templateFile ? "Avanti con template →" : "Avanti senza template →"}
            </button>
          </div>
        </div>
      )}

{/* ── STEP 0: Tipo cantiere ────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>
            Seleziona il tipo di cantiere
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {TIPI_CANTIERE.map(t => (
              <div
                key={t.id}
                onClick={() => setTipoCantiere(t.id)}
                style={{
                  padding: "18px 20px", borderRadius: 12, cursor: "pointer",
                  background: tipoCantiere === t.id ? "#1e3a5f" : "#161b27",
                  border: `2px solid ${tipoCantiere === t.id ? "#3b82f6" : "#1e2535"}`,
                  transition: "all .15s",
                }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tipoCantiere === t.id ? "#60a5fa" : "#cbd5e1", marginBottom: 6 }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { if (tipoCantiere) setStep(2); else setErrore("Seleziona un tipo di cantiere"); }}
              style={{
                padding: "12px 28px",
                background: tipoCantiere ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535",
                border: "none", borderRadius: 10, color: tipoCantiere ? "white" : "#475569",
                fontSize: 13, fontWeight: 700, cursor: tipoCantiere ? "pointer" : "not-allowed", fontFamily: "inherit",
              }}>
              Avanti →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 1: Carica documenti ─────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
            Carica i documenti del cantiere
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
            L'AI estrarrà automaticamente tutti i dati. Puoi caricare: notifica preliminare, capitolato, check list opere, contratti imprese, documenti anagrafici.
          </div>

          {/* Toggle SafetyAI */}
          {azienda && (
            <div style={{ padding: "14px 18px", marginBottom: 20, background: "#161b27", border: "1px solid #1e2535", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>
                  Usa anche i dati già presenti in SafetyAI
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>
                  Integra automaticamente i dati di {azienda.nome} (imprese, subappaltatori, cantieri)
                </div>
              </div>
              <div
                onClick={() => setUsaDatiSafetyAI(v => !v)}
                style={{
                  width: 48, height: 26, borderRadius: 13, flexShrink: 0,
                  background: usaDatiSafetyAI ? "#3b82f6" : "#1e2535",
                  border: `1px solid ${usaDatiSafetyAI ? "#3b82f680" : "#334155"}`,
                  cursor: "pointer", position: "relative",
                }}>
                <div style={{
                  position: "absolute", top: 3, left: usaDatiSafetyAI ? 25 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: usaDatiSafetyAI ? "white" : "#475569", transition: "left .2s",
                }} />
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${drag ? "#3b82f6" : "#1e2535"}`,
              borderRadius: 12, padding: "32px", textAlign: "center",
              background: drag ? "#1e3a5f10" : "#161b27",
              transition: "all .15s", marginBottom: 16, cursor: "pointer",
            }}
            onClick={() => document.getElementById("psc-file-input").click()}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
              Trascina i file qui oppure clicca per selezionare
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              PDF, DOCX, immagini — puoi caricare più file contemporaneamente
            </div>
            <input
              id="psc-file-input" type="file" multiple accept=".pdf,.docx,.doc,image/*"
              onChange={handleFileInput} style={{ display: "none" }}
            />
          </div>

          {/* Lista file */}
          {files.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 9 }}>
                  <span style={{ fontSize: 18 }}>
                    {f.type === "application/pdf" ? "📄" : f.name.endsWith(".docx") ? "📝" : "🖼️"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{fmtSize(f.size)}</div>
                  </div>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "#475569", fontSize: 16, cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && !usaDatiSafetyAI && (
            <div style={{ padding: "12px 16px", background: "#f59e0b10", border: "1px solid #f59e0b25", borderRadius: 8, fontSize: 12, color: "#fbbf24", marginBottom: 16 }}>
              💡 Carica almeno un documento oppure attiva l'integrazione con SafetyAI
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(1)} style={{ padding: "11px 20px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 9, color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              ← Indietro
            </button>
            <button
              onClick={handleEstraiDati}
              disabled={caricamento || (files.length === 0 && !usaDatiSafetyAI)}
              style={{
                padding: "11px 28px",
                background: caricamento ? "#1e3a5f" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
                border: "none", borderRadius: 9, color: "white",
                fontSize: 13, fontWeight: 700,
                cursor: caricamento ? "wait" : "pointer", fontFamily: "inherit",
              }}>
              {caricamento ? progressoMsg || "Analisi…" : "Analizza documenti →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Verifica dati estratti ──────────────────────────────── */}
      {step === 3 && datiEstratti && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
            Verifica i dati estratti
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
            Controlla i dati che verranno usati nel PSC. Puoi modificare direttamente i campi prima di generare il documento.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Cantiere */}
            <SezioneVerifica titolo="🏗️ Cantiere" dati={datiEstratti.cantiere}
              onChange={v => setDatiEstratti(d => ({ ...d, cantiere: v }))} />
            {/* Committente */}
            <SezioneVerifica titolo="👤 Committente" dati={datiEstratti.committente}
              onChange={v => setDatiEstratti(d => ({ ...d, committente: v }))} />
            {/* CSE */}
            <SezioneVerifica titolo="🦺 Coordinatore per la Sicurezza (CSE/CSP)" dati={datiEstratti.cse}
              onChange={v => setDatiEstratti(d => ({ ...d, cse: v }))} />
            {/* Impresa appaltatrice */}
            <SezioneVerifica titolo="🔨 Impresa appaltatrice" dati={datiEstratti.impresa_appaltatrice}
              onChange={v => setDatiEstratti(d => ({ ...d, impresa_appaltatrice: v }))} />
            {/* Subappaltatori */}
            {datiEstratti.subappaltatori?.length > 0 && (
              <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e2535", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                  🏢 Imprese subappaltatrici ({datiEstratti.subappaltatori.length})
                </div>
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {datiEstratti.subappaltatori.map((sub, i) => (
                    <div key={i} style={{ padding: "10px 14px", background: "#0f1117", borderRadius: 8, fontSize: 12, color: "#94a3b8" }}>
                      <div style={{ fontWeight: 700, color: "#cbd5e1", marginBottom: 4 }}>
                        {sub.numero || String(i+1).padStart(2,"0")} — {sub.specializzazione || "Specializzazione n.d."}
                      </div>
                      <div>{sub.ragione_sociale}</div>
                      {sub.telefono && <div>📞 {sub.telefono}</div>}
                      {sub.email && <div>✉️ {sub.email}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drop zone documenti aggiuntivi */}
          <div style={{ marginTop: 20, background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e2535", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>➕</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Aggiungi altri documenti</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                  Carica documenti aggiuntivi per completare i campi mancanti (indicati in rosso)
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              {/* Messaggio esito */}
              {msgAggiuntivo && (
                <div style={{
                  padding: "10px 14px", marginBottom: 12,
                  background: msgAggiuntivo.tipo === "ok" ? "#10b98115" : "#ef444415",
                  border: `1px solid ${msgAggiuntivo.tipo === "ok" ? "#10b98140" : "#ef444440"}`,
                  borderRadius: 8, fontSize: 12,
                  color: msgAggiuntivo.tipo === "ok" ? "#10b981" : "#fca5a5",
                }}>
                  {msgAggiuntivo.tipo === "ok" ? "✓ " : "⚠️ "}{msgAggiuntivo.testo}
                </div>
              )}

              {/* Drop area */}
              <div
                onDragOver={e => { e.preventDefault(); setDragAggiuntivo(true); }}
                onDragLeave={() => setDragAggiuntivo(false)}
                onDrop={e => {
                  e.preventDefault(); setDragAggiuntivo(false);
                  const dropped = Array.from(e.dataTransfer.files).filter(f =>
                    f.type === "application/pdf" || f.name.endsWith(".docx") ||
                    f.name.endsWith(".doc") || f.type.startsWith("image/")
                  );
                  setFilesAggiuntivi(prev => {
                    const nomi = new Set(prev.map(f => f.name));
                    return [...prev, ...dropped.filter(f => !nomi.has(f.name))];
                  });
                }}
                onClick={() => document.getElementById("psc-extra-input").click()}
                style={{
                  border: `2px dashed ${dragAggiuntivo ? "#3b82f6" : "#1e2535"}`,
                  borderRadius: 9, padding: "18px", textAlign: "center",
                  background: dragAggiuntivo ? "#1e3a5f10" : "#0f1117",
                  cursor: "pointer", transition: "all .15s",
                }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>📂</div>
                <div style={{ fontSize: 12, color: "#475569" }}>
                  Trascina altri PDF o DOCX qui, oppure clicca per selezionare
                </div>
                <input
                  id="psc-extra-input" type="file" multiple accept=".pdf,.docx,.doc,image/*"
                  onChange={e => {
                    const nuovi = Array.from(e.target.files).filter(f =>
                      f.type === "application/pdf" || f.name.endsWith(".docx") ||
                      f.name.endsWith(".doc") || f.type.startsWith("image/")
                    );
                    setFilesAggiuntivi(prev => {
                      const nomi = new Set(prev.map(f => f.name));
                      return [...prev, ...nuovi.filter(f => !nomi.has(f.name))];
                    });
                  }}
                  style={{ display: "none" }}
                />
              </div>

              {/* Lista file aggiuntivi */}
              {filesAggiuntivi.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {filesAggiuntivi.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8 }}>
                      <span style={{ fontSize: 14 }}>{f.type === "application/pdf" ? "📄" : "📝"}</span>
                      <div style={{ flex: 1, fontSize: 12, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>{fmtSize(f.size)}</div>
                      <button onClick={() => setFilesAggiuntivi(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "#475569", fontSize: 14, cursor: "pointer", flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                  <button
                    onClick={handleAggiungiDocumenti}
                    disabled={analisiAggiuntiva}
                    style={{
                      marginTop: 4, padding: "10px",
                      background: analisiAggiuntiva ? "#1e2535" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
                      border: "none", borderRadius: 8, color: analisiAggiuntiva ? "#475569" : "white",
                      fontSize: 12, fontWeight: 700, cursor: analisiAggiuntiva ? "wait" : "pointer",
                      fontFamily: "inherit",
                    }}>
                    {analisiAggiuntiva ? "Analisi in corso…" : `🔍 Analizza ${filesAggiuntivi.length} document${filesAggiuntivi.length > 1 ? "i" : "o"} e integra i dati`}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "14px 18px", background: "#f59e0b10", border: "1px solid #f59e0b25", borderRadius: 10, fontSize: 12, color: "#fbbf24" }}>
            💡 Il PSC generato è un documento di partenza professionale. Le sezioni che richiedono valutazione tecnica specifica del sito (layout cantiere, cronoprogramma dettagliato) dovranno essere integrate dal CSE nel documento finale.
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <button onClick={() => setStep(2)} style={{ padding: "11px 20px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 9, color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              ← Indietro
            </button>
            <button
              onClick={handleGeneraPSC}
              disabled={generazione}
              style={{
                padding: "11px 28px",
                background: generazione ? "#1e3a5f" : "linear-gradient(135deg,#16a34a,#15803d)",
                border: "none", borderRadius: 9, color: "white",
                fontSize: 13, fontWeight: 700,
                cursor: generazione ? "wait" : "pointer", fontFamily: "inherit",
              }}>
              {generazione ? progressoMsg || "Generazione…" : "📄 Genera PSC .docx"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Completato ───────────────────────────────────────────── */}
      {step === 4 && generato && (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 10 }}>
            PSC generato con successo
          </div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 32, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>
            Il documento Word è stato scaricato automaticamente. Aprilo con Microsoft Word o LibreOffice per rivedere e completare le sezioni che richiedono la tua valutazione tecnica diretta sul cantiere.
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleGeneraPSC}
              style={{ padding: "11px 22px", background: "#1e3a5f", border: "1px solid #3b82f630", borderRadius: 9, color: "#60a5fa", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ⬇ Riscarica documento
            </button>
            <button
              onClick={reset}
              style={{ padding: "11px 22px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              + Genera nuovo PSC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SEZIONE VERIFICA DATI (editabile) ───────────────────────────────────────
function SezioneVerifica({ titolo, dati, onChange }) {
  const [aperta, setAperta] = useState(true);
  if (!dati) return null;

  const LABEL_MAP = {
    descrizione: "Descrizione intervento", indirizzo: "Indirizzo", comune: "Comune",
    provincia: "Provincia", codice_edificio: "Cod. edificio", codice_ui: "Cod. UI",
    scala: "Scala", interno: "Interno", piano: "Piano", particella: "Particella",
    superficie_mq: "Superficie (m²)", anno_costruzione: "Anno costruzione",
    data_inizio: "Data inizio lavori", durata_mesi: "Durata (mesi)",
    importo_cme: "Importo CME (€)", n_imprese: "N. imprese", n_max_lavoratori: "N. max lavoratori",
    ragione_sociale: "Ragione sociale", telefono: "Telefono", email: "Email",
    fax: "Fax", pec: "PEC", nome: "Nome e cognome", ordine: "Iscrizione albo",
    studio: "Studio professionale", azienda: "Azienda", ruolo: "Ruolo",
    specializzazione: "Specializzazione",
  };

  return (
    <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
      <div
        onClick={() => setAperta(v => !v)}
        style={{ padding: "14px 18px", borderBottom: aperta ? "1px solid #1e2535" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{titolo}</div>
        <span style={{ color: "#475569" }}>{aperta ? "▾" : "▸"}</span>
      </div>
      {aperta && (
        <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {Object.entries(dati).filter(([k]) => k !== "subappaltatori").map(([chiave, valore]) => (
            <div key={chiave}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.3px", display: "block", marginBottom: 4 }}>
                {LABEL_MAP[chiave] || chiave.replace(/_/g, " ").toUpperCase()}
              </label>
              <input
                value={valore || ""}
                onChange={e => onChange({ ...dati, [chiave]: e.target.value || null })}
                style={{
                  width: "100%", padding: "8px 10px", boxSizing: "border-box",
                  background: "#0f1117", border: `1px solid ${valore ? "#1e2535" : "#ef444430"}`,
                  borderRadius: 7, color: valore ? "#cbd5e1" : "#ef4444",
                  fontSize: 12, fontFamily: "inherit",
                }}
                placeholder={valore ? "" : "non trovato"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
r", fontFamily: "inherit" }}>
              + Genera nuovo PSC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SEZIONE VERIFICA DATI (editabile) ───────────────────────────────────────
function SezioneVerifica({ titolo, dati, onChange }) {
  const [aperta, setAperta] = useState(true);
  if (!dati) return null;

  const LABEL_MAP = {
    descrizione: "Descrizione intervento", indirizzo: "Indirizzo", comune: "Comune",
    provincia: "Provincia", codice_edificio: "Cod. edificio", codice_ui: "Cod. UI",
    scala: "Scala", interno: "Interno", piano: "Piano", particella: "Particella",
    superficie_mq: "Superficie (m²)", anno_costruzione: "Anno costruzione",
    data_inizio: "Data inizio lavori", durata_mesi: "Durata (mesi)",
    importo_cme: "Importo CME (€)", n_imprese: "N. imprese", n_max_lavoratori: "N. max lavoratori",
    ragione_sociale: "Ragione sociale", telefono: "Telefono", email: "Email",
    fax: "Fax", pec: "PEC", nome: "Nome e cognome", ordine: "Iscrizione albo",
    studio: "Studio professionale", azienda: "Azienda", ruolo: "Ruolo",
    specializzazione: "Specializzazione",
  };

  return (
    <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
      <div
        onClick={() => setAperta(v => !v)}
        style={{ padding: "14px 18px", borderBottom: aperta ? "1px solid #1e2535" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{titolo}</div>
        <span style={{ color: "#475569" }}>{aperta ? "▾" : "▸"}</span>
      </div>
      {aperta && (
        <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {Object.entries(dati).filter(([k]) => k !== "subappaltatori").map(([chiave, valore]) => (
            <div key={chiave}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.3px", display: "block", marginBottom: 4 }}>
                {LABEL_MAP[chiave] || chiave.replace(/_/g, " ").toUpperCase()}
              </label>
              <input
                value={valore || ""}
                onChange={e => onChange({ ...dati, [chiave]: e.target.value || null })}
                style={{
                  width: "100%", padding: "8px 10px", boxSizing: "border-box",
                  background: "#0f1117", border: `1px solid ${valore ? "#1e2535" : "#ef444430"}`,
                  borderRadius: 7, color: valore ? "#cbd5e1" : "#ef4444",
                  fontSize: 12, fontFamily: "inherit",
                }}
                placeholder={valore ? "" : "non trovato"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
