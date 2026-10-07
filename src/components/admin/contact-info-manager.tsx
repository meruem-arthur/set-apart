import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { getContactInfo, setContactInfo } from "@/functions/contact";
import { DEFAULT_CONTACT, whatsAppUrl } from "@/lib/contact";

export function ContactInfoManager() {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["contact-info"], queryFn: () => getContactInfo() });
  const [phone, setPhone] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!q.data) return;
    setPhone(q.data.phone);
    setWhatsapp(q.data.whatsapp === q.data.phone ? "" : q.data.whatsapp);
    setEmail(q.data.email);
  }, [q.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await setContactInfo({ data: { phone, whatsapp, email } });
      await queryClient.invalidateQueries({ queryKey: ["contact-info"] });
      toast.success("Contact info saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const field = "glass-field w-full rounded-2xl px-4 py-3 text-sm focus:outline-none";
  return (
    <form onSubmit={save} className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">Contact info</h2>
        <p className="mt-0.5 text-xs text-ink/45">
          Shown in the storefront footer and on the order tracking page. Leave a field empty to use the default.
        </p>
      </div>
      <label className="block text-xs text-ink/60">
        Phone (call button)
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={DEFAULT_CONTACT.phone} inputMode="tel" className={`${field} mt-1`} />
      </label>
      <label className="block text-xs text-ink/60">
        WhatsApp number <span className="text-ink/35">(blank = same as phone)</span>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={phone || DEFAULT_CONTACT.whatsapp} inputMode="tel" className={`${field} mt-1`} />
      </label>
      <label className="block text-xs text-ink/60">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={DEFAULT_CONTACT.email} className={`${field} mt-1`} />
      </label>
      <p className="text-[11px] text-ink/40">WhatsApp link: {whatsAppUrl(whatsapp || phone || DEFAULT_CONTACT.whatsapp)}</p>
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={saving} className="btn-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold">
        {saving && <Spinner />}
        {saving ? "Saving…" : "Save contact info"}
      </button>
    </form>
  );
}
