import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { getLamsContact } from "@/functions/lams";
import { LAMS, lamsSmsHref, lamsSnapHref, lamsTelHref } from "@/data/lams";

export const Route = createFileRoute("/lams")({
  loader: async () => ({ contact: await getLamsContact() }),
  head: () => ({
    meta: [
      { title: "SET APART × LAMS — Anime Merchandise Pre-Orders" },
      { name: "description", content: `${LAMS.fullName}: ${LAMS.intro}` },
    ],
  }),
  component: LamsPage,
});

const btn = "inline-flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-bold tracking-[.15em]";

function LamsPage() {
  const { contact } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed]">
      <header className="border-b border-white/10 bg-[#050505]/85">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 text-xs font-bold">
            <ArrowLeft size={16} /> BACK TO SET APART
          </Link>
          <span className="text-xl font-black tracking-[-.08em]">SET APART × LAMS</span>
          <span className="hidden text-[10px] font-bold tracking-[.2em] text-white/40 md:block">COLLAB</span>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[1fr_420px] md:py-16">
        <div>
          <p className="text-[10px] font-bold tracking-[.3em] text-white/50">NEW COLLAB</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-.08em] md:text-7xl">
            SET APART
            <br />× LAMS
          </h1>
          <p className="mt-6 text-lg font-bold">{LAMS.fullName}</p>
          <p className="mt-1 text-sm italic text-white/55">{LAMS.tagline}</p>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/65">{LAMS.intro}</p>

          <div className="mt-10">
            <p className="text-[10px] font-bold tracking-[.3em] text-white/50">WHAT YOU CAN PRE-ORDER</p>
            <ul className="mt-4 grid max-w-xl grid-cols-2 gap-px border border-white/10 bg-white/10 text-sm font-bold">
              {LAMS.products.map((x) => (
                <li key={x} className="bg-[#0b0b0e] px-4 py-4">
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-4 text-white/45">LAMS is a pre-ordering store: get in touch to place a pre-order.</p>
          </div>

          <div className="mt-10">
            <p className="text-[10px] font-bold tracking-[.3em] text-white/50">GET IN TOUCH</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={contact.whatsappCommunity} target="_blank" rel="noreferrer" className={`${btn} btn-glass`}>
                <MessageCircle size={15} /> JOIN THE LAMS WHATSAPP
              </a>
              <a href={lamsTelHref(contact)} className={`${btn} btn-glass-light`}>
                <Phone size={15} /> CALL {contact.phone}
              </a>
              <a href={lamsSmsHref(contact)} className={`${btn} btn-glass-light`}>
                TEXT {contact.phone}
              </a>
              <a href={lamsSnapHref(contact)} target="_blank" rel="noreferrer" className={`${btn} btn-glass-light`}>
                SNAPCHAT: {contact.snapchat.toUpperCase()} <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
        <picture className="block">
          <source srcSet={LAMS.flyerWebp} type="image/webp" />
          <img
            src={LAMS.flyer}
            alt="LAMS — Leiru's Anime Merchandise Pre-Ordering Store flyer"
            width={707}
            height={1000}
            className="hud w-full"
          />
        </picture>
      </main>
    </div>
  );
}
