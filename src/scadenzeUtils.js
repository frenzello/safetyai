// Helper puri per scadenze/statistiche — lavorano sull'albero azienda già caricato
// da dbSupabase.js (caricaAziendaCompleta), non fanno I/O.

export function genId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

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
