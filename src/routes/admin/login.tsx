import * as React from "react";
import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { loginStaff, getCurrentStaff } from "@/functions/auth";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Staff Login — SET APART" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const current = await getCurrentStaff();
    if (current) throw redirect({ to: current.role === "super_admin" ? "/super-admin" : "/admin" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const account = await loginStaff({ data: { identifier, password } });
      toast.success("Login successful");
      await navigate({ to: account.role === "super_admin" ? "/super-admin" : "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <img
            src="/icon-192.png"
            alt="SET APART logo"
            className="mx-auto size-16 rounded-2xl object-cover ring-1 ring-white/15 shadow-[0_0_32px_-6px_rgba(225,6,0,.55)]"
          />
          <h1 className="mt-3 text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-ink/50">SET APART</p>
        </div>

        <input
          required
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email (Admin) or username (Staff)"
          autoComplete="username"
          className="glass-field w-full rounded-2xl px-4 py-3 text-sm focus:outline-none"
        />
        <PasswordInput
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="glass-field rounded-2xl py-3 pl-4 text-sm focus:outline-none"
        />

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-glass inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-wide"
        >
          {submitting && <Spinner />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="text-center text-xs text-ink/45">
          <Link to="/admin/forgot-password" className="font-medium text-clay hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
