/** LAMS — Leiru's Anime Merchandise pre-ordering Store. Collaboration partner of SET APART. */
export const LAMS = {
  name: "LAMS",
  fullName: "Leiru's Anime Merchandise Pre-Ordering Store",
  tagline: "Unleash your inner otaku",
  intro:
    "Affordable anime merchandise and collectables, plus updates on incoming anime and gaming events and parties.",
  products: ["Katana", "Gaming gloves", "Gaming thumb sleeves", "Necklaces", "Bracelets", "Rings", "Beanies", "Caps & more"],
  phone: "0201759514",
  snapchat: "leiru_0",
  whatsappCommunity: "https://chat.whatsapp.com/C403LyUoo4QHG6aDQkdjoy",
  flyer: "/lams-flyer.jpg",
  flyerWebp: "/lams-flyer.webp",
} as const;

export const lamsTelHref = () => `tel:${LAMS.phone}`;
export const lamsSmsHref = () => `sms:${LAMS.phone}`;
export const lamsSnapHref = () => `https://www.snapchat.com/add/${LAMS.snapchat}`;
