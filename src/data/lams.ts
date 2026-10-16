/** LAMS — Leiru's Anime Merchandise pre-ordering Store. Collaboration partner of SET APART. */
export const LAMS = {
  name: "LAMS",
  fullName: "Leiru's Anime Merchandise Pre-Ordering Store",
  tagline: "Unleash your inner otaku",
  intro:
    "Affordable anime merchandise and collectables, plus updates on incoming anime and gaming events and parties.",
  products: ["Katana", "Gaming gloves", "Gaming thumb sleeves", "Necklaces", "Bracelets", "Rings", "Beanies", "Caps & more"],
  flyer: "/lams-flyer.jpg",
  flyerWebp: "/lams-flyer.webp",
} as const;

/** Editable by the Super Admin (Settings → LAMS contact). These are the defaults. */
export type LamsContact = { phone: string; snapchat: string; whatsappCommunity: string };
export const DEFAULT_LAMS_CONTACT: LamsContact = {
  phone: "0201759514",
  snapchat: "leiru_0",
  whatsappCommunity: "https://chat.whatsapp.com/C403LyUoo4QHG6aDQkdjoy",
};

const digits = (n: string) => (n || "").replace(/[^\d+]/g, "");
export const lamsTelHref = (c: LamsContact) => `tel:${digits(c.phone)}`;
export const lamsSmsHref = (c: LamsContact) => `sms:${digits(c.phone)}`;
export const lamsSnapHref = (c: LamsContact) => `https://www.snapchat.com/add/${encodeURIComponent(c.snapchat.replace(/^@/, ""))}`;
