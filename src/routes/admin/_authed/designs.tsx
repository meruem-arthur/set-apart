import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listCustomDesigns, updateCustomDesign } from "@/functions/custom-designs";
import { readDesignSides } from "@/lib/shirt-mockup";

export const Route = createFileRoute("/admin/_authed/designs")({ loader: listCustomDesigns, component: Designs });

const link = "border px-3 py-2 text-[10px] font-bold";

function Designs() {
  const rows = Route.useLoaderData();
  const [busy, setBusy] = React.useState<number | null>(null);
  async function status(id: number, status: any) {
    setBusy(id);
    try {
      await updateCustomDesign({ data: { id, status } });
      location.reload();
    } finally {
      setBusy(null);
    }
  }
  return (
    <div>
      <div className="border-b border-white/10 pb-6">
        <p className="text-[10px] font-bold tracking-[.3em] text-white/40">CUSTOM STUDIO</p>
        <h1 className="mt-2 text-4xl font-black">Design Requests</h1>
      </div>
      <div className="mt-6 space-y-3">
        {rows.map((d: any) => {
          const { front, back } = readDesignSides(d);
          return (
            <div key={d.id} className="border border-white/10 bg-card p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-[.2em] text-white/40">REQUEST #{d.id}</p>
                  <h2 className="mt-2 text-xl font-black">{d.name}</h2>
                  <p className="mt-1 text-sm text-white/55">
                    {d.email} · {d.phone}
                  </p>
                  <p className="mt-3 text-xs font-bold">
                    {d.shirtColor} / {d.size} × {d.quantity}
                  </p>
                  <p className="mt-1 text-[10px] font-bold tracking-[.15em] text-white/45">
                    PRINT: {[front.artworkUrl && "FRONT", back?.artworkUrl && "BACK"].filter(Boolean).join(" + ") || "—"}
                  </p>
                  {d.notes && <p className="mt-2 text-sm text-white/55">{d.notes}</p>}
                  {(front.mockupUrl || back?.mockupUrl) && (
                    <div className="mt-4 flex gap-3">
                      {front.mockupUrl && (
                        <a href={front.mockupUrl} target="_blank" rel="noreferrer">
                          <img src={front.mockupUrl} alt="Front mockup" className="h-40 w-auto border border-white/10" />
                          <span className="mt-1 block text-center text-[9px] font-bold tracking-[.2em] text-white/40">FRONT</span>
                        </a>
                      )}
                      {back?.mockupUrl && (
                        <a href={back.mockupUrl} target="_blank" rel="noreferrer">
                          <img src={back.mockupUrl} alt="Back mockup" className="h-40 w-auto border border-white/10" />
                          <span className="mt-1 block text-center text-[9px] font-bold tracking-[.2em] text-white/40">BACK</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {front.artworkUrl && (
                    <a href={front.artworkUrl} target="_blank" rel="noreferrer" className={link}>
                      FRONT ARTWORK ↗
                    </a>
                  )}
                  {back?.artworkUrl && (
                    <a href={back.artworkUrl} target="_blank" rel="noreferrer" className={link}>
                      BACK ARTWORK ↗
                    </a>
                  )}
                  <select disabled={busy === d.id} value={d.status} onChange={(e) => status(d.id, e.target.value)} className={link}>
                    <option>pending</option>
                    <option>reviewing</option>
                    <option>contacted</option>
                    <option>approved</option>
                    <option>rejected</option>
                    <option>completed</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
