import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { requestCustomerPasswordReset } from "@/functions/customers";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — SET APART" }, { name: "robots", content: "noindex" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await requestCustomerPasswordReset({ data: { email } });
      setMessage(r.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-[#ededed]">
      <form onSubmit={submit} className="w-full max-w-md border border-white/12 bg-[#0d0d10] p-7">
        <Link to="/account" className="text-xs font-bold">← SIGN IN</Link>
        <h1 className="mt-12 text-4xl font-black">FORGOT PASSWORD.</h1>
        <p className="mt-3 text-sm text-white/55">Enter your email and we'll send you a link to set a new password.</p>
        {message ? (
          <p className="mt-6 border border-white/15 bg-white/5 p-3 text-sm text-white/80">{message} The link expires in 30 minutes.</p>
        ) : (
          <>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" className="mt-6 w-full border p-3" />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <button disabled={busy} className="btn-glass mt-5 w-full rounded-full py-4 text-xs font-bold">{busy ? "SENDING…" : "SEND RESET LINK"}</button>
          </>
        )}
      </form>
    </main>
  );
}
