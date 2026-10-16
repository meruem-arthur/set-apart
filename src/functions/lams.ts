import { createServerFn } from "@tanstack/react-start";
import { inArray, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireStaff } from "./auth";
import { DEFAULT_LAMS_CONTACT, type LamsContact } from "@/data/lams";

const KEYS = { phone: "lams_phone", snapchat: "lams_snapchat", whatsappCommunity: "lams_whatsapp_community" } as const;

/** Public: LAMS contact details for the /lams page and the home section. Falls back to defaults. */
export const getLamsContact = createServerFn({ method: "GET" }).handler(async (): Promise<LamsContact> => {
  const out: LamsContact = { ...DEFAULT_LAMS_CONTACT };
  try {
    const rows = await db.select().from(siteSettings).where(inArray(siteSettings.key, Object.values(KEYS)));
    for (const r of rows) {
      if (!r.value) continue;
      for (const [field, key] of Object.entries(KEYS) as [keyof LamsContact, string][]) if (r.key === key) out[field] = r.value;
    }
  } catch (err) {
    console.error("[lams] load failed", err);
  }
  return out;
});

const phone = z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/, "Enter a valid phone number.").or(z.literal(""));
const snapchat = z.string().trim().regex(/^@?[A-Za-z0-9._-]{2,32}$/, "Enter a valid Snapchat username.").or(z.literal(""));
const link = z.string().trim().url("Enter a full link starting with https://").refine((v) => /^https:\/\//i.test(v), "Link must start with https://").or(z.literal(""));

/** Super Admin only. Empty value = reset that field to the default. */
export const setLamsContact = createServerFn({ method: "POST" })
  .validator(z.object({ phone, snapchat, whatsappCommunity: link }))
  .handler(async ({ data }) => {
    await requireStaff({ role: ["super_admin"] });
    for (const [field, key] of Object.entries(KEYS) as [keyof typeof KEYS, string][]) {
      const value = data[field].replace(/^@/, "");
      if (!value) {
        await db.delete(siteSettings).where(eq(siteSettings.key, key));
      } else {
        await db
          .insert(siteSettings)
          .values({ key, value })
          .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
      }
    }
    return { success: true };
  });
