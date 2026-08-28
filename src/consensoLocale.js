// Flag locale (per dispositivo) di accettazione privacy/DPA alla prima schermata.
// Non è un dato personale del lavoratore né multi-tenant: resta in localStorage
// anche dopo la migrazione a Supabase.
export function privacyAccettata() {
  return localStorage.getItem("safetyai_privacy_ok") === "true";
}

export function accettaPrivacy() {
  localStorage.setItem("safetyai_privacy_ok", "true");
}
