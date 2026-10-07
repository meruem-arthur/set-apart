/** Client-safe contact helpers + defaults (the Super Admin can override these in Settings). */
export type ContactInfo = { phone: string; whatsapp: string; email: string };

export const DEFAULT_CONTACT: ContactInfo = {
  phone: "0244139665",
  whatsapp: "0244139665",
  email: "meruemarthur@gmail.com",
};

/** Turns a Ghana local number (024…) or an international one into wa.me format (233…). */
export function toWhatsAppDigits(input: string): string {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "233" + d.slice(1);
  return d;
}

export function whatsAppUrl(input: string): string {
  return `https://wa.me/${toWhatsAppDigits(input)}`;
}

export function telHref(input: string): string {
  return `tel:${(input || "").replace(/[^\d+]/g, "")}`;
}
