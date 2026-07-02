// Livello dati SU SUPABASE (async) — sostituto multi-tenant di database.js (localStorage).
// owner_id viene popolato dal database (default auth.uid()) e la Row Level Security
// garantisce che ogni account veda SOLO i propri dati.
//
// NOTA DI MIGRAZIONE: queste funzioni sono ASINCRONE. I chiamanti attuali (App.js,
// moduli) usano le versioni sincrone di database.js: al momento dello "switch" andranno
// adattati con async/await. Questo file non è ancora importato da nessuna parte.
import { supabase } from "./supabaseClient";

// ─── AZIENDE ──────────────────────────────────────────────────────────────────
export async function listaAziende() {
  const { data, error } = await supabase
    .from("aziende").select("*").order("creato_il", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function creaAzienda(dati) {
  const { data, error } = await supabase.from("aziende").insert({
    nome: dati.nome || "", piva: dati.piva || "", sede: dati.sede || "",
    ateco: dati.ateco || "", settore: dati.settore || "", dipendenti: dati.dipendenti ?? null,
    figure: dati.figure || {}, rischi: dati.rischi || [],
  }).select().single();
  if (error) throw error;
  return data;
}

export async function aggiornaAzienda(id, patch) {
  const { data, error } = await supabase
    .from("aziende").update({ ...patch, aggiornato_il: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function eliminaAzienda(id) {
  const { error } = await supabase.from("aziende").delete().eq("id", id);
  if (error) throw error;
}

// ─── APPALTI / APPALTATORI / LAVORATORI ───────────────────────────────────────
export async function creaAppalto(aziendaId, dati) {
  const { data, error } = await supabase.from("appalti").insert({
    azienda_id: aziendaId, titolo: dati.titolo || "", area: dati.area || "",
    data_inizio: dati.dataInizio || null, data_fine: dati.dataFine || null,
    stato: dati.stato || "attivo", cse_nome: dati.cseNome || "",
  }).select().single();
  if (error) throw error;
  return data;
}

export async function creaAppaltatore(appaltoId, dati, parentId = null) {
  const { data, error } = await supabase.from("appaltatori").insert({
    appalto_id: appaltoId, parent_id: parentId,
    nome: dati.nome || "", piva: dati.piva || "", referente: dati.referente || "",
    email: dati.email || "", telefono: dati.telefono || "",
  }).select().single();
  if (error) throw error;
  return data;
}

export async function creaLavoratore(appaltatoreId, dati) {
  const { data, error } = await supabase.from("lavoratori").insert({
    appaltatore_id: appaltatoreId, nome: dati.nome || "", cf: dati.cf || "", mansione: dati.mansione || "",
  }).select().single();
  if (error) throw error;
  return data;
}

// ─── CARICAMENTO NIDIFICATO (per l'UI, che lavora con la struttura ad albero) ──
export async function caricaAziendaCompleta(aziendaId) {
  const [az, appalti, appaltatori, lavoratori, attestati] = await Promise.all([
    supabase.from("aziende").select("*").eq("id", aziendaId).single(),
    supabase.from("appalti").select("*").eq("azienda_id", aziendaId),
    supabase.from("appaltatori").select("*"),
    supabase.from("lavoratori").select("*"),
    supabase.from("attestati").select("*"),
  ]);
  for (const r of [az, appalti, appaltatori, lavoratori, attestati]) if (r.error) throw r.error;

  const attByLav = groupBy(attestati.data || [], "lavoratore_id");
  const lavByApp = groupBy(lavoratori.data || [], "appaltatore_id");
  const appByAppalto = groupBy((appaltatori.data || []).filter(a => !a.parent_id), "appalto_id");
  const subByParent = groupBy((appaltatori.data || []).filter(a => a.parent_id), "parent_id");

  const buildApp = (a) => ({
    ...a,
    lavoratori: (lavByApp[a.id] || []).map(l => ({ ...l, attestati: attByLav[l.id] || [] })),
    subappaltatori: (subByParent[a.id] || []).map(buildApp),
  });

  return {
    ...az.data,
    appalti: (appalti.data || []).map(ap => ({
      ...ap,
      appaltatori: (appByAppalto[ap.id] || []).map(buildApp),
    })),
  };
}

function groupBy(rows, key) {
  return rows.reduce((acc, r) => { (acc[r[key]] ||= []).push(r); return acc; }, {});
}

// ─── SALVA RISULTATI ANALISI AI ───────────────────────────────────────────────
// Equivalente async di salvaRisultatiAnalisi: crea lavoratori/attestati mancanti.
export async function salvaRisultatiAnalisi(appaltatoreId, elaborati, decisioniConformita = {}) {
  const { data: lavEsistenti, error: e1 } = await supabase
    .from("lavoratori").select("id, nome").eq("appaltatore_id", appaltatoreId);
  if (e1) throw e1;

  const perNome = new Map((lavEsistenti || []).map(l => [l.nome.toLowerCase().trim(), l]));
  let nuoviLavoratori = 0, nuoviAttestati = 0;

  for (const doc of elaborati) {
    const r = doc.risultato;
    if (!r || r.errore || r.categoria !== "lavoratore" || !r.nome_lavoratore) continue;

    const chiaveNome = r.nome_lavoratore.toLowerCase().trim();
    let lav = perNome.get(chiaveNome);
    if (!lav) {
      lav = await creaLavoratore(appaltatoreId, { nome: r.nome_lavoratore, cf: r.codice_fiscale || "" });
      perNome.set(chiaveNome, lav);
      nuoviLavoratori++;
    }

    const chiave = `${r.nome_lavoratore}__${doc.nomeFile}`;
    const { error: e2 } = await supabase.from("attestati").insert({
      lavoratore_id: lav.id,
      tipo: r.tipo_documento || "",
      rilascio: toISO(r.data_rilascio),
      scadenza: toISO(r.data_scadenza),
      ore: r.ore_formazione ?? null,
      ente: r.ente_erogatore || "",
      normativa: r.normativa || "",
      conforme: r.conforme ?? null,
      problema_conformita: r.problema_conformita || "",
      decisione_operatore: decisioniConformita[chiave] || null,
      confidenza: r.confidenza ?? 0,
      note: r.note || "",
    });
    if (e2) throw e2;
    nuoviAttestati++;
  }
  return { nuoviLavoratori, nuoviAttestati };
}

// Converte "GG/MM/AAAA" in ISO "AAAA-MM-GG" per le colonne date; null se non valida.
function toISO(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
  const [, g, mm, a] = m;
  return `${a}-${mm.padStart(2, "0")}-${g.padStart(2, "0")}`;
}
