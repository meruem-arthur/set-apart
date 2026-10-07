import { createServerFn } from "@tanstack/react-start";
import { eq, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireStaff } from "./auth";

/** Page images the Super Admin can change. Stored in site_settings as `img_<slot>`. */
export const SITE_IMAGE_SLOTS = [
  { slot: "home_hero", label: "Home — hero background", hint: "Wide/landscape works best (about 1600×1000)." },
  { slot: "home_drop", label: "Home — drop panel", hint: "Tall/portrait works best (about 800×1000)." },
  { slot: "home_custom", label: "Home — “Your design, your tee” panel", hint: "Landscape or square." },
  { slot: "shop_banner", label: "Shop page — banner", hint: "Very wide (about 1800×500)." },
  { slot: "custom_banner", label: "Custom Tee page — banner", hint: "Very wide (about 1800×500)." },
] as const;

export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number]["slot"];
const slotNames = SITE_IMAGE_SLOTS.map((s) => s.slot) as [SiteImageSlot, ...SiteImageSlot[]];

export const getSiteImages = createServerFn({ method: "GET" }).handler(async () => {
  const out: Record<string, string | null> = {};
  for (const s of SITE_IMAGE_SLOTS) out[s.slot] = null;
  try {
    const rows = await db.select().from(siteSettings).where(like(siteSettings.key, "img_%"));
    for (const r of rows) {
      const slot = r.key.replace(/^img_/, "");
      if (slot in out && r.value) out[slot] = r.value;
    }
  } catch (err) {
    // Never break a page because decorative images couldn't load.
    console.error("[site-images] load failed", err);
  }
  return out;
});

export const setSiteImage = createServerFn({ method: "POST" })
  .validator(z.object({ slot: z.enum(slotNames), url: z.string().url().or(z.literal("")) }))
  .handler(async ({ data }) => {
    await requireStaff({ role: ["super_admin"] });
    const key = `img_${data.slot}`;
    if (!data.url) {
      await db.delete(siteSettings).where(eq(siteSettings.key, key));
    } else {
      await db
        .insert(siteSettings)
        .values({ key, value: data.url })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value: data.url, updatedAt: new Date() } });
    }
    return { success: true };
  });
