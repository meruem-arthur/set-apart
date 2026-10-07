import crypto from "node:crypto";

/**
 * Stateless, signed, single-use password-link tokens for customers.
 * No DB table needed: the token embeds a fingerprint of the customer's current
 * password hash, so it stops working the moment the password changes.
 */
const TTL_MS = 30 * 60 * 1000;
export const CUSTOMER_RESET_TTL_MINUTES = 30;

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not set.");
  return process.env.SESSION_SECRET;
}
const sign = (v: string) => crypto.createHmac("sha256", secret()).update(`customer-pw-reset:${v}`).digest("base64url");
export const passwordFingerprint = (hash: string | null | undefined) =>
  crypto.createHash("sha256").update(hash ?? "").digest("hex").slice(0, 16);

export function createCustomerResetToken(c: { id: number; passwordHash: string | null }) {
  const body = Buffer.from(JSON.stringify({ c: c.id, f: passwordFingerprint(c.passwordHash), exp: Date.now() + TTL_MS })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readCustomerResetToken(token: string): { customerId: number; fingerprint: string } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const x = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof x.c !== "number" || typeof x.f !== "string" || !(x.exp > Date.now())) return null;
    return { customerId: x.c, fingerprint: x.f };
  } catch {
    return null;
  }
}
