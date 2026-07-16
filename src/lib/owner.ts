// Emails allowed to read + write the private document. Must match the RLS
// allowlist in supabase-setup.sql exactly. On the hosted site, only these
// signed-in users see content; everyone else gets the locked screen.
export const OWNER_EMAILS = [
  "marilynliewpj@gmail.com",
  "marilyn@wearemakerlab.com",
];

export function isOwnerEmail(email: string | undefined | null): boolean {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase());
}
