import { createServerFn } from "@tanstack/react-start";
import { inArray, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireStaff } from "./auth";
import { DEFAULT_CONTACT, type ContactInfo } from "@/lib/contact";

const KEYS = { phone: "contact_phone", whatsapp: "contact_whatsapp", email: "contact_email" } as const;

/** Public: used by the storefront footer and order page. Falls back to defaults. */
export const getContactInfo = createServerFn({ method: "GET" }).handler(async (): Promise<ContactInfo> => {
  const out: ContactInfo = { ...DEFAULT_CONTACT };
  try {
    const rows = await db.select().from(siteSettings).where(inArray(siteSettings.key, Object.values(KEYS)));
    for (const r of rows) {
      if (!r.value) continue;
      if (r.key === KEYS.phone) out.phone = r.value;
      if (r.key === KEYS.whatsapp) out.whatsapp = r.value;
      if (r.key === KEYS.email) out.email = r.value;
    }
  } catch (err) {
    console.error("[contact] load failed", err);
  }
  // WhatsApp follows the call number unless set separately.
  const rowsHaveWhatsApp = out.whatsapp !== DEFAULT_CONTACT.whatsapp;
  if (!rowsHaveWhatsApp && out.phone !== DEFAULT_CONTACT.phone) out.whatsapp = out.phone;
  return out;
});

const phone = z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/, "Enter a valid phone number.").or(z.literal(""));

/** Super Admin only. Empty value = reset that field to the default. */
export const setContactInfo = createServerFn({ method: "POST" })
  .validator(z.object({ phone, whatsapp: phone, email: z.string().trim().email("Enter a valid email.").or(z.literal("")) }))
  .handler(async ({ data }) => {
    await requireStaff({ role: ["super_admin"] });
    for (const [field, key] of Object.entries(KEYS) as [keyof typeof KEYS, string][]) {
      const value = data[field];
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
