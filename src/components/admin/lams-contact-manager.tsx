import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { getLamsContact, setLamsContact } from "@/functions/lams";
import { DEFAULT_LAMS_CONTACT } from "@/data/lams";

export function LamsContactManager() {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["lams-contact"], queryFn: () => getLamsContact() });
  const [phone, setPhone] = React.useState("");
  const [snapchat, setSnapchat] = React.useState("");
  const [whatsappCommunity, setCommunity] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!q.data) return;
    setPhone(q.data.phone);
    setSnapchat(q.data.snapchat);
    setCommunity(q.data.whatsappCommunity);
  }, [q.data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await setLamsContact({ data: { phone, snapchat, whatsappCommunity } });
      await queryClient.invalidateQueries({ queryKey: ["lams-contact"] });
      toast.success("LAMS contact saved");
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
        <h2 className="text-lg font-semibold">LAMS contact</h2>
        <p className="mt-0.5 text-xs text-ink/45">
          Shown on the SET APART × LAMS page and home section. Leave a field empty to use the default.
        </p>
      </div>
      <label className="block text-xs text-ink/60">
        Phone (call / text)
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={DEFAULT_LAMS_CONTACT.phone} inputMode="tel" className={`${field} mt-1`} />
      </label>
      <label className="block text-xs text-ink/60">
        Snapchat username
        <input value={snapchat} onChange={(e) => setSnapchat(e.target.value)} placeholder={DEFAULT_LAMS_CONTACT.snapchat} className={`${field} mt-1`} />
      </label>
      <label className="block text-xs text-ink/60">
        WhatsApp community link
        <input value={whatsappCommunity} onChange={(e) => setCommunity(e.target.value)} placeholder={DEFAULT_LAMS_CONTACT.whatsappCommunity} inputMode="url" className={`${field} mt-1`} />
      </label>
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={saving} className="btn-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold">
        {saving && <Spinner />}
        {saving ? "Saving…" : "Save LAMS contact"}
      </button>
    </form>
  );
}
