import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { resetCustomerPassword } from "@/functions/customers";
import { PasswordInput } from "@/components/ui/password-input";

export const Route = createFileRoute("/reset-password/$token")({
  head: () => ({ meta: [{ title: "Set password — SET APART" }, { name: "robots", content: "noindex" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token } = Route.useParams();
  const nav = useNavigate();
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      await resetCustomerPassword({ data: { token, password } });
      toast.success("Password saved — you're signed in");
      await router.invalidate();
      await nav({ to: "/account" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-[#ededed]">
      <form onSubmit={submit} className="w-full max-w-md border border-white/12 bg-[#0d0d10] p-7">
        <Link to="/" className="text-xs font-bold">← SET APART</Link>
        <h1 className="mt-12 text-4xl font-black">SET PASSWORD.</h1>
        <div className="mt-6 space-y-3">
          <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (8+ characters)" autoComplete="new-password" className="border p-3" />
          <PasswordInput required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password" className="border p-3" />
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-400">
            {error} {error.includes("expired") && <Link to="/forgot-password" className="underline">Request a new link</Link>}
          </p>
        )}
        <button disabled={busy} className="btn-glass mt-5 w-full rounded-full py-4 text-xs font-bold">{busy ? "SAVING…" : "SAVE PASSWORD"}</button>
      </form>
    </main>
  );
}
