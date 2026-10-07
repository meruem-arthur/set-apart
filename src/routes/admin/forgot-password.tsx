import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { requestPasswordReset } from "@/functions/auth";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/admin/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — SET APART" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset({ data: { email } });
      setSubmitted(true);
      toast.success("Reset link sent — check your email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <img
            src="/icon-192.png"
            alt="SET APART logo"
            className="mx-auto size-16 rounded-2xl object-cover ring-1 ring-white/15 shadow-[0_0_32px_-6px_rgba(225,6,0,.55)]"
          />
          <h1 className="mt-3 text-xl font-semibold">Reset your password</h1>
          <p className="mt-1 text-sm text-ink/50">For Admin &amp; Super Admin accounts</p>
        </div>

        {submitted ? (
          <p className="glass-field rounded-2xl p-4 text-center text-sm text-ink/70">
            If that email is registered to an Admin account, we've sent a password reset link. It
            expires in 30 minutes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Registered email address"
              autoComplete="email"
              className="glass-field w-full rounded-2xl px-4 py-3 text-sm focus:outline-none"
            />
            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-glass inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-wide"
            >
              {submitting && <Spinner />}
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div className="rounded-2xl bg-amber/10 p-4 text-center text-xs text-ink/60 ring-1 ring-white/10">
          <strong className="font-semibold text-ink/75">Staff account?</strong> For security
          reasons, staff password resets are handled by the administrator. Please contact your
          administrator for assistance.
        </div>

        <div className="text-center text-xs">
          <Link to="/admin/login" className="font-medium text-clay hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
