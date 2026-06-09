const DB_KEY = "safetyai_db_v1";

const DB_DEFAULT = {
  versione: 1,
  creatoIl: new Date().toISOString(),
  aziende: [],
};

export function genId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function leggiDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { ...DB_DEFAULT, aziende: [] };
    return JSON.parse(raw);
  } catch {
    return { ...DB_DEFAULT, aziende: [] };
  }
}

export function salvaDB(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return true;
  } catch (e) {
    console.error("Errore salvataggio DB:", e);
    return false;
  }
}

export function resetDB() {
  localStorage.removeItem(DB_KEY);
}

// ─── AZIENDE ──────────────────────────────────────────────────────────────────
export function creaAzienda(dati) {
  const db = leggiDB();
  const nuova = {
    id: genId("az"),
    nome: dati.nome || "",
    piva: dati.piva || "",
    sede: dati.sede || "",
    ateco: dati.ateco || "",
    settore: dati.settore || "",
    dipendenti: dati.dipendenti || null,
    figure: {
      datoreLavoro: dati.figure?.datoreLavoro || "",
      rspp: dati.figure?.rspp || "",
      medicoCompetente: dati.figure?.medicoCompetente || "",
      rls: dati.figure?.rls || "",
    },
    rischi: dati.rischi || [],
    appalti: [],
    creatoIl: new Date().toISOString(),
    aggiornatoIl: new Date().toISOString(),
  };
  db.aziende.push(nuova);
  salvaDB(db);
  return nuova;
}

export function aggiornaAzienda(id, dati) {
  const db = leggiDB();
  const idx = db.aziende.findIndex(a => a.id === id);
  if (idx === -1) return null;
  db.aziende[idx] = {
    ...db.aziende[idx],
    ...dati,
    figure: { ...db.aziende[idx].figure, ...(dati.figure || {}) },
    aggiornatoIl: new Date().toISOString(),
  };
  salvaDB(db);
  return db.aziende[idx];
}

export function eliminaAzienda(id) {
  const db = leggiDB();
  db.aziende = db.aziende.filter(a => a.id !== id);
  salvaDB(db);
}

// ─── APPALTI ──────────────────────────────────────────────────────────────────
export function creaAppalto(aziendaId, dati) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  if (!az) return null;
  const nuovo = {
    id: genId("ap"),
    titolo: dati.titolo || "",
    area: dati.area || "",
    dataInizio: dati.dataInizio || "",
    dataFine: dati.dataFine || "",
    stato: "attivo",
    cseNome: dati.cseNome || "",
    appaltatori: [],
    documenti: [],
    creatoIl: new Date().toISOString(),
  };
  az.appalti.push(nuovo);
  az.aggiornatoIl = new Date().toISOString();
  salvaDB(db);
  return nuovo;
}

export function aggiornaAppalto(aziendaId, appaltoId, dati) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  if (!az) return null;
  const idx = az.appalti.findIndex(p => p.id === appaltoId);
  if (idx === -1) return null;
  az.appalti[idx] = { ...az.appalti[idx], ...dati };
  az.aggiornatoIl = new Date().toISOString();
  salvaDB(db);
  return az.appalti[idx];
}

export function eliminaAppalto(aziendaId, appaltoId) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  if (!az) return;
  az.appalti = az.appalti.filter(p => p.id !== appaltoId);
  salvaDB(db);
}

// ─── APPALTATORI ──────────────────────────────────────────────────────────────
export function creaAppaltatore(aziendaId, appaltoId, dati) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  if (!az) return null;
  const ap = az.appalti.find(p => p.id === appaltoId);
  if (!ap) return null;
  const nuovo = {
    id: genId("imp"),
    nome: dati.nome || "",
    piva: dati.piva || "",
    referente: dati.referente || "",
    email: dati.email || "",
    telefono: dati.telefono || "",
    documentiAziendali: [],
    lavoratori: [],
    subappaltatori: [],
    creatoIl: new Date().toISOString(),
  };
  ap.appaltatori.push(nuovo);
  salvaDB(db);
  return nuovo;
}

export function aggiornaAppaltatore(aziendaId, appaltoId, appaltatoreId, dati) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  const ap = az?.appalti.find(p => p.id === appaltoId);
  const idx = ap?.appaltatori.findIndex(a => a.id === appaltatoreId);
  if (!ap || idx === -1) return null;
  ap.appaltatori[idx] = { ...ap.appaltatori[idx], ...dati };
  salvaDB(db);
  return ap.appaltatori[idx];
}

export function eliminaAppaltatore(aziendaId, appaltoId, appaltatoreId) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  const ap = az?.appalti.find(p => p.id === appaltoId);
  if (!ap) return;
  ap.appaltatori = ap.appaltatori.filter(a => a.id !== appaltatoreId);
  salvaDB(db);
}

// ─── SUBAPPALTATORI ───────────────────────────────────────────────────────────
export function creaSubappaltatore(aziendaId, appaltoId, appaltatoreId, dati) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  const ap = az?.appalti.find(p => p.id === appaltoId);
  const app = ap?.appaltatori.find(a => a.id === appaltatoreId);
  if (!app) return null;
  const nuovo = {
    id: genId("sub"),
    nome: dati.nome || "",
    piva: dati.piva || "",
    referente: dati.referente || "",
    email: dati.email || "",
    documentiAziendali: [],
    lavoratori: [],
    creatoIl: new Date().toISOString(),
  };
  if (!app.subappaltatori) app.subappaltatori = [];
  app.subappaltatori.push(nuovo);
  salvaDB(db);
  return nuovo;
}

export function eliminaSubappaltatore(aziendaId, appaltoId, appaltatoreId, subId) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  const ap = az?.appalti.find(p => p.id === appaltoId);
  const app = ap?.appaltatori.find(a => a.id === appaltatoreId);
  if (!app) return;
  app.subappaltatori = (app.subappaltatori || []).filter(s => s.id !== subId);
  salvaDB(db);
}

// ─── SALVA RISULTATI ANALISI AI ───────────────────────────────────────────────
// Chiamata da UploadMassivo dopo l'analisi — salva lavoratori e attestati nel DB
export function salvaRisultatiAnalisi(aziendaId, appaltoId, appaltatoreId, elaborati, decisioniConformita = {}) {
  const db = leggiDB();
  const az = db.aziende.find(a => a.id === aziendaId);
  const ap = az?.appalti.find(p => p.id === appaltoId);
  const appaltatore = ap?.appaltatori.find(a => a.id === appaltatoreId);
  if (!appaltatore) return null;

  let nuoviLavoratori = 0;
  let nuoviAttestati = 0;

  elaborati.forEach(doc => {
    if (!doc.risultato || doc.risultato.errore) return;
    const r = doc.risultato;
    if (r.categoria !== "lavoratore" || !r.nome_lavoratore) return;

    // Cerca se il lavoratore esiste già
    let lav = appaltatore.lavoratori.find(
      l => l.nome.toLowerCase().trim() === r.nome_lavoratore.toLowerCase().trim()
    );

    // Se non esiste, crealo
    if (!lav) {
      lav = {
        id: genId("lav"),
        nome: r.nome_lavoratore,
        cf: r.codice_fiscale || "",
        mansione: "",
        attestati: [],
        creatoIl: new Date().toISOString(),
      };
      appaltatore.lavoratori.push(lav);
      nuoviLavoratori++;
    }

    // Controlla se l'attestato esiste già (stesso tipo + stesso rilascio)
    const esiste = lav.attestati.some(
      a => a.tipo === r.tipo_documento && a.rilascio === r.data_rilascio
    );
    if (esiste) return;

    const chiave = `${r.nome_lavoratore}__${doc.nomeFile}`;
    const decisione = decisioniConformita[chiave] || null;

    lav.attestati.push({
      id: genId("att"),
      tipo: r.tipo_documento || "",
      scadenza: r.data_scadenza || null,
      rilascio: r.data_rilascio || null,
      ore: r.ore_formazione || null,
      ente: r.ente_erogatore || "",
      normativa: r.normativa || "",
      conforme: r.conforme ?? null,
      problemaConformita: r.problema_conformita || "",
      decisioneOperatore: decisione,
      confidenza: r.confidenza || 0,
      note: r.note || "",
      creatoIl: new Date().toISOString(),
    });
    nuoviAttestati++;
  });

  az.aggiornatoIl = new Date().toISOString();
  salvaDB(db);
  return { nuoviLavoratori, nuoviAttestati };
}

// ─── HELPERS SCADENZE ─────────────────────────────────────────────────────────
export function giorniAllaScadenza(dataStr) {
  if (!dataStr) return null;
  const parts = dataStr.split("/");
  if (parts.length !== 3) return null;
  const [g, m, a] = parts;
  const d = new Date(`${a}-${m.padStart(2,"0")}-${g.padStart(2,"0")}`);
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
}

export function statoScadenza(dataStr) {
  const giorni = giorniAllaScadenza(dataStr);
  if (giorni === null) return "nessuna";
  if (giorni < 0) return "scaduto";
  if (giorni <= 15) return "critico";
  if (giorni <= 60) return "attenzione";
  return "ok";
}

// ─── TUTTE LE SCADENZE DI UN'AZIENDA (per RegistroScadenze) ──────────────────
export function tutteLeScadenze(azienda) {
  const lista = [];
  for (const ap of azienda.appalti || []) {
    for (const app of ap.appaltatori || []) {
      const imprese = [
        { ...app, tipo: "appaltatore" },
        ...(app.subappaltatori || []).map(s => ({ ...s, tipo: "subappaltatore", parentNome: app.nome })),
      ];
      for (const imp of imprese) {
        for (const lav of imp.lavoratori || []) {
          for (const att of lav.attestati || []) {
            lista.push({
              appaltoId: ap.id,
              appaltoTitolo: ap.titolo,
              appaltatoreId: app.id,
              appaltatoreNome: app.nome,
              impresaNome: imp.nome,
              impresaTipo: imp.tipo,
              lavoratoreId: lav.id,
              lavoratoreNome: lav.nome,
              attestatoId: att.id,
              attestatoTipo: att.tipo,
              scadenza: att.scadenza,
              rilascio: att.rilascio,
              conforme: att.conforme,
              decisioneOperatore: att.decisioneOperatore,
              stato: statoScadenza(att.scadenza),
              giorni: giorniAllaScadenza(att.scadenza),
            });
          }
        }
      }
    }
  }
  return lista.sort((a, b) => (a.giorni ?? 9999) - (b.giorni ?? 9999));
}

// ─── STATISTICHE AZIENDA ──────────────────────────────────────────────────────
export function calcolaStatAzienda(azienda) {
  let totLavoratori = 0, totAttestati = 0, scaduti = 0, inScadenza = 0, bloccati = 0, appaltiAttivi = 0;
  for (const ap of azienda.appalti || []) {
    if (ap.stato === "attivo") appaltiAttivi++;
    for (const app of ap.appaltatori || []) {
      const tutti = [
        ...app.lavoratori,
        ...(app.subappaltatori || []).flatMap(s => s.lavoratori),
      ];
      for (const lav of tutti) {
        totLavoratori++;
        let haScaduto = false;
        for (const att of lav.attestati || []) {
          totAttestati++;
          const s = statoScadenza(att.scadenza);
          if (s === "scaduto") { scaduti++; haScaduto = true; }
          if (s === "attenzione" || s === "critico") inScadenza++;
        }
        if (haScaduto) bloccati++;
      }
    }
  }
  return { totLavoratori, totAttestati, scaduti, inScadenza, bloccati, appaltiAttivi };
}

// ─── PRIVACY ──────────────────────────────────────────────────────────────────
export function privacyAccettata() {
  return localStorage.getItem("safetyai_privacy_ok") === "true";
}

export function accettaPrivacy() {
  localStorage.setItem("safetyai_privacy_ok", "true");
}
