import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, RotateCcw, Upload, X } from "lucide-react";
import { createCustomDesign } from "@/functions/custom-designs";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { getSiteImages } from "@/functions/site-images";
import {
  PRINT,
  SHIRT_COLORS,
  VIEW_H,
  VIEW_W,
  artSize,
  clampOffset,
  emptyLayer,
  renderMockupFile,
  shirtBaseSvg,
  shirtShadeSvg,
  svgUrl,
  type Layer,
  type ShirtColor,
  type Side,
} from "@/lib/shirt-mockup";

export const Route = createFileRoute("/custom")({
  head: () => ({ meta: [{ title: "Create Your Tee — SET APART" }] }),
  loader: async () => ({ siteImages: await getSiteImages() }),
  component: CustomTee,
});

const SIDES: Side[] = ["front", "back"];
const field = "w-full border border-white/12 px-3 py-3 text-sm";
const label = "text-[10px] font-bold tracking-[.2em] text-white/50";

function readFile(file: File) {
  return new Promise<{ art: string; natW: number; natH: number }>((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Could not read that image."));
    r.onload = () => {
      const art = String(r.result);
      const i = new Image();
      i.onerror = () => reject(new Error("That image could not be opened."));
      i.onload = () => resolve({ art, natW: i.naturalWidth, natH: i.naturalHeight });
      i.src = art;
    };
    r.readAsDataURL(file);
  });
}

function CustomTee() {
  const { siteImages } = Route.useLoaderData();
  const [shirt, setShirt] = React.useState<ShirtColor>("Black");
  const [side, setSide] = React.useState<Side>("front");
  const [layers, setLayers] = React.useState<Record<Side, Layer>>({ front: emptyLayer(), back: emptyLayer() });
  const [size, setSize] = React.useState("M");
  const [qty, setQty] = React.useState(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [requestId, setRequestId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const stage = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const layer = layers[side];
  const p = PRINT[side];
  const hex = SHIRT_COLORS[shirt];
  const baseSrc = React.useMemo(() => svgUrl(shirtBaseSvg(hex, side)), [hex, side]);
  const shadeSrc = React.useMemo(() => svgUrl(shirtShadeSvg(hex, side)), [hex, side]);
  const dims = artSize(side, layer);
  const hasArt = Boolean(layers.front.art || layers.back.art);
  const submitted = requestId !== null;

  const patch = (s: Side, v: Partial<Layer>) => setLayers((all) => ({ ...all, [s]: { ...all[s], ...v } }));
  const move = (dx: number, dy: number) => {
    const c = clampOffset(side, layer.x + dx, layer.y + dy);
    patch(side, c);
  };

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setError("Please choose an image under 8MB.");
      return;
    }
    try {
      setError(null);
      const { art, natW, natH } = await readFile(f);
      patch(side, { ...emptyLayer(), art, file: f, natW, natH });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLImageElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: layer.x, y: layer.y };
  }
  function onPointerMove(e: React.PointerEvent<HTMLImageElement>) {
    const d = drag.current;
    const box = stage.current?.getBoundingClientRect();
    if (!d || !box) return;
    const k = VIEW_W / box.width;
    patch(side, clampOffset(side, d.x + (e.clientX - d.px) * k, d.y + (e.clientY - d.py) * k));
  }
  const onPointerUp = () => {
    drag.current = null;
  };

  async function submit() {
    setError(null);
    if (!hasArt) {
      setError("Upload your artwork first.");
      return;
    }
    if (!name || !email || !phone) {
      setError("Name, email and phone are required.");
      return;
    }
    setBusy(true);
    try {
      // Upload each distinct file once (the same artwork can be used on both sides).
      const uploaded = new Map<File, string>();
      const artworkFor = async (l: Layer) => {
        if (!l.art || !l.file) return null;
        const hit = uploaded.get(l.file);
        if (hit) return hit;
        const url = await uploadImageToCloudinary(l.file);
        uploaded.set(l.file, url);
        return url;
      };
      const mockupFor = async (s: Side) => {
        const l = layers[s];
        if (!l.art) return null;
        return uploadImageToCloudinary(await renderMockupFile(shirt, s, l));
      };
      const [frontArt, backArt] = [await artworkFor(layers.front), await artworkFor(layers.back)];
      const [frontMock, backMock] = [await mockupFor("front"), await mockupFor("back")];
      const t = (l: Layer) => ({ scale: l.scale, rotation: l.rotation, x: l.x, y: l.y });
      const r = await createCustomDesign({
        data: {
          name,
          email,
          phone,
          shirtColor: shirt,
          size,
          quantity: qty,
          artworkUrl: frontArt,
          mockupUrl: frontMock,
          transform: JSON.stringify({
            version: 2,
            front: t(layers.front),
            back: { ...t(layers.back), artworkUrl: backArt, mockupUrl: backMock },
          }),
          notes: notes || null,
        },
      });
      setRequestId(r.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit your design request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed]">
      <header className="border-b border-white/10 bg-[#050505]/85">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 text-xs font-bold">
            <ArrowLeft size={16} /> BACK TO SET APART
          </Link>
          <span className="text-xl font-black tracking-[-.08em]">CUSTOM TEE</span>
          <span className="text-[10px] font-bold tracking-[.2em] text-white/40">STUDIO</span>
        </div>
      </header>
      {siteImages.custom_banner && (
        <div className="mx-auto mt-6 h-40 max-w-7xl overflow-hidden px-5 md:h-64">
          <img src={siteImages.custom_banner} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <main className="mx-auto max-w-7xl px-5 py-10 md:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-[10px] font-bold tracking-[.3em] text-white/50">CUSTOM DESIGN STUDIO</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-.08em] md:text-7xl">
            YOUR DESIGN.
            <br />
            YOUR TEE.
          </h1>
          <p className="mt-5 text-sm leading-6 text-white/62">
            Upload your artwork, place it on the front and/or back of the shirt and send the design to SET APART. This is a
            design request, not an automatic order.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_430px]">
          <section className="hud-off overflow-hidden bg-[#dedbd4] p-5 text-[#111] md:p-10">
            <div className="flex items-center justify-between">
              <div className="inline-flex border border-black/20">
                {SIDES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`px-5 py-2 text-[10px] font-bold tracking-[.2em] ${side === s ? "bg-black text-white" : ""}`}
                  >
                    {s.toUpperCase()}
                    {layers[s].art && <span className="ml-2 inline-block size-1.5 rounded-full bg-[#e10600] align-middle" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => patch(side, { scale: 1, rotation: 0, x: 0, y: 0 })}
                className="flex items-center gap-2 text-[10px] font-bold"
              >
                <RotateCcw size={13} /> RESET
              </button>
            </div>
            <div
              ref={stage}
              className="relative mx-auto mt-6 aspect-[4/5] w-full max-w-[540px] select-none overflow-hidden rounded-sm"
              style={{ background: "radial-gradient(ellipse at 50% 38%, #e6e3dc 0%, #d4d1c9 70%, #c9c6be 100%)" }}
            >
              <img src={baseSrc} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
              <div
                className="pointer-events-none absolute border border-dashed border-black/25"
                style={{
                  left: `${(p.x0 / VIEW_W) * 100}%`,
                  top: `${(p.y0 / VIEW_H) * 100}%`,
                  width: `${((p.x1 - p.x0) / VIEW_W) * 100}%`,
                  height: `${((p.y1 - p.y0) / VIEW_H) * 100}%`,
                }}
              >
                {!layer.art && (
                  <span className="absolute inset-0 grid place-items-center text-[9px] font-bold tracking-[.2em] text-black/25 mix-blend-difference">
                    {side.toUpperCase()} PRINT AREA
                  </span>
                )}
              </div>
              {layer.art && (
                <img
                  src={layer.art}
                  alt="Artwork preview"
                  draggable={false}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className="absolute cursor-grab touch-none active:cursor-grabbing"
                  style={{
                    left: `${((p.cx + layer.x) / VIEW_W) * 100}%`,
                    top: `${((p.cy + layer.y) / VIEW_H) * 100}%`,
                    width: `${(dims.w / VIEW_W) * 100}%`,
                    transform: `translate(-50%,-50%) rotate(${layer.rotation}deg)`,
                  }}
                />
              )}
              <img src={shadeSrc} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
            </div>
            <p className="mt-4 text-center text-[10px] font-bold tracking-[.18em] text-black/45">
              {layer.art ? "DRAG THE ARTWORK TO POSITION IT" : `UPLOAD ARTWORK FOR THE ${side.toUpperCase()}`}
            </p>
          </section>
          <aside className="space-y-6 rounded-2xl border border-white/12 bg-[#0d0d10] p-5 md:p-7">
            <div>
              <p className={label}>01 / SHIRT</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(Object.keys(SHIRT_COLORS) as ShirtColor[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setShirt(s)}
                    className={`border px-3 py-4 text-xs font-bold ${shirt === s ? "border-white bg-white text-black" : "border-white/15"}`}
                  >
                    <span className="mx-auto mb-2 block size-7 rounded-full border border-white/12" style={{ background: SHIRT_COLORS[s] }} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={label}>02 / SIZE & QUANTITY</p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {["S", "M", "L", "XL", "XXL"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`border py-3 text-xs font-bold ${size === s ? "border-white bg-white text-black" : "border-white/15"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={100}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(100, +e.target.value || 1)))}
                className={`mt-2 ${field}`}
                placeholder="Quantity"
              />
            </div>
            <div>
              <p className={label}>03 / ARTWORK — {side.toUpperCase()}</p>
              <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} className="hidden" />
              <button
                onClick={() => input.current?.click()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-5 text-xs font-bold"
              >
                <Upload size={16} />
                {layer.art ? `CHANGE ${side.toUpperCase()} ARTWORK` : `UPLOAD ${side.toUpperCase()} IMAGE`}
              </button>
              <p className="mt-2 text-[10px] leading-4 text-white/50">
                PNG, JPG or WebP · max 8MB. Transparent PNGs look best on coloured shirts. Use the FRONT / BACK tabs to design both sides.
              </p>
              {side === "back" && layers.front.art && (
                <button
                  onClick={() => patch("back", { ...layers.front })}
                  className="mt-3 flex items-center gap-2 text-[10px] font-bold text-white/70"
                >
                  <Copy size={13} /> USE THE FRONT DESIGN ON THE BACK TOO
                </button>
              )}
              {side === "front" && layers.back.art && (
                <button
                  onClick={() => patch("front", { ...layers.back })}
                  className="mt-3 flex items-center gap-2 text-[10px] font-bold text-white/70"
                >
                  <Copy size={13} /> USE THE BACK DESIGN ON THE FRONT TOO
                </button>
              )}
            </div>
            {layer.art && (
              <div className="space-y-4 border-t border-white/10 pt-5">
                <label className="block text-[10px] font-bold">
                  SIZE
                  <input
                    type="range"
                    min=".4"
                    max="1.5"
                    step=".05"
                    value={layer.scale}
                    onChange={(e) => patch(side, { scale: +e.target.value })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-[10px] font-bold">
                  ROTATION
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={layer.rotation}
                    onChange={(e) => patch(side, { rotation: +e.target.value })}
                    className="mt-2 w-full"
                  />
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => move(-6, 0)} className="border py-2 text-xs font-bold" aria-label="Move left">←</button>
                  <button onClick={() => move(0, -6)} className="border py-2 text-xs font-bold" aria-label="Move up">↑</button>
                  <button onClick={() => move(0, 6)} className="border py-2 text-xs font-bold" aria-label="Move down">↓</button>
                  <button onClick={() => move(6, 0)} className="border py-2 text-xs font-bold" aria-label="Move right">→</button>
                </div>
                <button
                  onClick={() => patch(side, emptyLayer())}
                  className="flex items-center gap-2 text-[10px] font-bold text-white/55"
                >
                  <X size={13} /> REMOVE {side.toUpperCase()} ARTWORK
                </button>
              </div>
            )}
            <div className="border-t border-white/10 pt-5">
              <p className={`mb-3 ${label}`}>04 / YOUR DETAILS</p>
              <div className="space-y-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={field} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className={field} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone / WhatsApp" className={field} />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={3} className={field} />
              </div>
            </div>
            {error && <p className="rounded-xl bg-red-950/40 p-3 text-xs text-red-400">{error}</p>}
            <button
              disabled={!hasArt || busy || submitted}
              onClick={submit}
              className="w-full rounded-full btn-glass px-5 py-4 text-xs font-bold tracking-[.15em] disabled:opacity-30"
            >
              {busy ? "UPLOADING & SUBMITTING…" : submitted ? "REQUEST SUBMITTED" : "SUBMIT DESIGN REQUEST"}
            </button>
            {submitted && (
              <div className="flex gap-3 rounded-xl bg-emerald-950/50 p-4 text-xs">
                <Check size={17} />
                <span>Request #{requestId} has been received. SET APART will review your artwork and contact you before production.</span>
              </div>
            )}
            <p className="text-[10px] leading-4 text-white/50">
              Only upload artwork you have permission to use. SET APART will not automatically publish customer artwork.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
