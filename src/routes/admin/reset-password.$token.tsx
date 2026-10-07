import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { resetPasswordWithToken } from "@/functions/auth";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/admin/reset-password/$token")({
  head: () => ({
    meta: [
      { title: "Set New Password — SET APART" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPasswordWithToken({ data: { token, newPassword: password } });
      setDone(true);
      toast.success("Password updated");
      setTimeout(() => navigate({ to: "/admin/login" }), 2000);
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
          <h1 className="mt-3 text-xl font-semibold">Set a new password</h1>
        </div>

        {done ? (
          <p className="rounded-2xl bg-sage/10 p-4 text-center text-sm text-sage ring-1 ring-white/10">
            Password updated. Redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="glass-field rounded-2xl py-3 pl-4 text-sm focus:outline-none"
            />
            <PasswordInput
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="glass-field rounded-2xl py-3 pl-4 text-sm focus:outline-none"
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
              {submitting ? "Saving…" : "Set new password"}
            </button>
          </form>
        )}

        <div className="text-center text-xs">
          <Link to="/admin/login" className="font-medium text-clay hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
