import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCurrentCustomer, loginCustomer, registerCustomer, logoutCustomer, getMyOrders } from "@/functions/customers";
import { PasswordInput } from "@/components/ui/password-input";

export const Route = createFileRoute("/account")({ loader: () => getCurrentCustomer(), component: Account });

const money = (n: number) => `GH₵${n.toFixed(2)}`;

function Orders() {
  const q = useQuery({ queryKey: ["my-orders"], queryFn: () => getMyOrders() });
  return (
    <section className="mt-10">
      <p className="text-[10px] font-bold tracking-[.3em] text-white/50">YOUR ORDERS</p>
      {q.isLoading ? (
        <p className="mt-4 text-sm text-white/50">Loading…</p>
      ) : !q.data?.length ? (
        <p className="mt-4 text-sm text-white/50">No orders yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {q.data.map((o) => (
            <Link key={o.trackingToken} to="/order/$token" params={{ token: o.trackingToken }} search={{ reference: undefined, trxref: undefined }} className="flex items-center justify-between border border-white/10 bg-[#0d0d10] p-4 text-sm transition hover:border-white/30">
              <span>
                <span className="font-bold">{o.orderNumber}</span>
                <span className="ml-3 text-xs text-white/45">{new Date(o.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="text-right">
                <span className="block font-bold">{money(o.total)}</span>
                <span className="text-[10px] uppercase tracking-[.18em] text-white/50">{o.status}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Account() {
  const c = Route.useLoaderData();
  const nav = useNavigate();
  const router = useRouter();
  const [register, setRegister] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  if (c)
    return (
      <main className="min-h-screen bg-[#050505] px-5 py-10 text-[#ededed]">
        <div className="mx-auto max-w-xl">
          <Link to="/" className="text-xs font-bold">← SET APART</Link>
          <h1 className="mt-12 text-5xl font-black">ACCOUNT.</h1>
          <p className="mt-3">{c.name}<br />{c.email}</p>
          <div className="mt-8 flex gap-3">
            <Link to="/shop" className="btn-glass rounded-full px-5 py-3 text-xs font-bold">SHOP</Link>
            <button
              onClick={async () => { await logoutCustomer(); await router.invalidate(); await nav({ to: "/" }); }}
              className="btn-glass-light rounded-full px-5 py-3 text-xs font-bold"
            >
              LOG OUT
            </button>
          </div>
          <Orders />
        </div>
      </main>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      if (register) {
        const r = await registerCustomer({ data: { name, email, password } });
        if ("verify" in r) {
          setNotice(`We found earlier orders with ${r.email}. To protect them, we've emailed a link to set your password and open your account.`);
          return;
        }
      } else {
        await loginCustomer({ data: { email, password } });
      }
      await router.invalidate();
      await nav({ to: "/account" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-[#ededed]">
      <form onSubmit={submit} className="w-full max-w-md border border-white/12 bg-[#0d0d10] p-7">
        <Link to="/" className="text-xs font-bold">← SET APART</Link>
        <h1 className="mt-12 text-5xl font-black">{register ? "JOIN." : "SIGN IN."}</h1>
        {register && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="mt-8 w-full border p-3" />}
        <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" autoComplete="email" className="mt-3 w-full border p-3" />
        <div className="mt-3">
          <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" autoComplete={register ? "new-password" : "current-password"} className="border p-3" />
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {notice && <p className="mt-3 border border-white/15 bg-white/5 p-3 text-sm text-white/80">{notice}</p>}
        <button className="btn-glass mt-5 w-full rounded-full py-4 text-xs font-bold">{register ? "CREATE ACCOUNT" : "SIGN IN"}</button>
        {!register && <Link to="/forgot-password" className="mt-4 block text-center text-xs font-bold text-white/60 hover:text-white">Forgot password?</Link>}
        <button type="button" onClick={() => { setRegister(!register); setError(null); setNotice(null); }} className="mt-4 w-full text-xs font-bold underline">
          {register ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      </form>
    </main>
  );
}
