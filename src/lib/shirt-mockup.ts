/**
 * Shirt mockup renderer for the Custom Tee studio.
 *
 * The mockup is built from three stacked layers, all in one 800x1000 coordinate space:
 *   1. BASE  – shirt silhouette in the chosen colour (neck opening, rib collar, floor shadow)
 *   2. ART   – the customer's artwork (HTML <img> in the preview, canvas draw on export)
 *   3. SHADE – transparent fabric shading (folds, seams, stitching, weave, edge falloff)
 *
 * Because SHADE sits ABOVE the artwork, the print picks up the folds and lighting of the
 * fabric, which is what makes it read as a real printed shirt instead of a flat sticker.
 * The preview and the exported JPEG use the exact same numbers, so what the customer sees
 * is what SET APART receives.
 */
export const SHIRT_COLORS = { Black: "#151515", White: "#f0eee8", Cream: "#d7c5a9" } as const;
export type ShirtColor = keyof typeof SHIRT_COLORS;
export type Side = "front" | "back";

export const VIEW_W = 800;
export const VIEW_H = 1000;
export const BACKDROP = "#d8d5ce";

/** Printable zone and default artwork box for each side, in viewBox units. */
export const PRINT: Record<Side, { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; boxW: number; boxH: number }> = {
  front: { x0: 268, y0: 236, x1: 532, y1: 576, cx: 400, cy: 396, boxW: 250, boxH: 310 },
  back: { x0: 240, y0: 212, x1: 560, y1: 650, cx: 400, cy: 420, boxW: 300, boxH: 390 },
};

export type Layer = {
  /** data URL of the artwork, or null when nothing is uploaded for this side */
  art: string | null;
  file: File | null;
  natW: number;
  natH: number;
  scale: number;
  rotation: number;
  /** offset of the artwork centre from the print area centre, in viewBox units */
  x: number;
  y: number;
};

export const emptyLayer = (): Layer => ({ art: null, file: null, natW: 0, natH: 0, scale: 1, rotation: 0, x: 0, y: 0 });

/** Size (in viewBox units) the artwork is drawn at: fitted inside the side's art box, then scaled. */
export function artSize(side: Side, l: Pick<Layer, "natW" | "natH" | "scale">) {
  const p = PRINT[side];
  if (!l.natW || !l.natH) return { w: 0, h: 0 };
  const fit = Math.min(p.boxW / l.natW, p.boxH / l.natH);
  return { w: l.natW * fit * l.scale, h: l.natH * fit * l.scale };
}

export function clampOffset(side: Side, x: number, y: number) {
  const p = PRINT[side];
  return {
    x: Math.max(p.x0 - p.cx, Math.min(p.x1 - p.cx, x)),
    y: Math.max(p.y0 - p.cy, Math.min(p.y1 - p.cy, y)),
  };
}

function outline(side: Side) {
  const neck = side === "front" ? "C 462 200, 338 200, 332 118" : "C 452 142, 348 142, 332 118";
  return (
    "M 332 118 C 300 132, 250 152, 205 170 L 135 198 C 112 207, 98 222, 90 242 L 42 372 " +
    "C 39 382, 44 390, 53 394 L 160 436 C 172 440, 184 434, 188 422 C 192 480, 188 560, 184 640 " +
    "C 180 740, 178 820, 176 892 Q 400 910 624 892 C 622 820, 620 740, 616 640 " +
    "C 612 560, 608 480, 612 422 C 616 434, 628 440, 640 436 L 747 394 C 756 390, 761 382, 758 372 " +
    "L 710 242 C 702 222, 688 207, 665 198 L 595 170 C 550 152, 500 132, 468 118 " +
    neck +
    " Z"
  );
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
function mix(hex: string, to: number, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.round(v + (to - v) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

const NS = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';

export function shirtBaseSvg(color: string, side: Side): string {
  const inner = mix(color, 0, 0.55);
  const rib = mix(color, luminance(color) > 0.5 ? 0 : 255, luminance(color) > 0.5 ? 0.05 : 0.08);
  const o = outline(side);
  const neck =
    side === "front"
      ? `<path d="M 332 118 C 336 98, 464 98, 468 118 C 462 200, 338 200, 332 118 Z" fill="${inner}"/>
         <path d="M 326 122 C 336 213, 464 213, 474 122" fill="none" stroke="${rib}" stroke-width="19"/>
         <path d="M 326 122 C 336 213, 464 213, 474 122" fill="none" stroke="rgba(0,0,0,.16)" stroke-width="19" stroke-dasharray="1.2 3.2"/>`
      : `<path d="M 332 118 C 340 108, 460 108, 468 118 C 452 142, 348 142, 332 118 Z" fill="${inner}"/>
         <path d="M 328 122 C 348 154, 452 154, 472 122" fill="none" stroke="${rib}" stroke-width="15"/>
         <path d="M 328 122 C 348 154, 452 154, 472 122" fill="none" stroke="rgba(0,0,0,.16)" stroke-width="15" stroke-dasharray="1.2 3.2"/>
         <rect x="370" y="160" width="60" height="24" rx="2" fill="#f4f2ee" stroke="rgba(0,0,0,.25)" stroke-width=".8"/>
         <text x="400" y="175" font-family="Arial, Helvetica, sans-serif" font-size="8.5" font-weight="700" letter-spacing="1.2" text-anchor="middle" fill="#111">SET APART</text>`;
  return `<svg ${NS} viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${VIEW_W}" height="${VIEW_H}">
  <defs><filter id="fs" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="16"/></filter></defs>
  <ellipse cx="400" cy="918" rx="260" ry="24" fill="rgba(0,0,0,.30)" filter="url(#fs)"/>
  <path d="${o}" fill="${color}"/>
  ${neck}
</svg>`;
}

export function shirtShadeSvg(color: string, side: Side): string {
  const lum = luminance(color);
  // Dark fabrics need stronger highlights to show form; light fabrics need stronger shadows.
  const hl = lum < 0.25 ? 2.2 : lum < 0.6 ? 1.2 : 0.8;
  const sh = lum < 0.25 ? 0.5 : lum < 0.6 ? 1 : 1.25;
  const o = outline(side);
  const k = (a: number) => (a * hl).toFixed(3);
  const d = (a: number) => (a * sh).toFixed(3);

  const half = `
    <path d="M 205 170 L 135 198 C 112 207, 98 222, 90 242 L 42 372 C 39 382, 44 390, 53 394 L 160 436 C 172 440, 184 434, 188 422 C 232 350, 240 250, 205 170 Z" fill="url(#sl)"/>
    <path d="M 205 170 C 240 250, 232 350, 188 422" fill="none" stroke="rgba(0,0,0,${d(0.32)})" stroke-width="1.8"/>
    <path d="M 209 172 C 244 252, 236 352, 192 424" fill="none" stroke="rgba(255,255,255,${k(0.10)})" stroke-width="1"/>
    <path d="M 58 381 L 165 423" fill="none" stroke="rgba(0,0,0,${d(0.30)})" stroke-width="1.4" stroke-dasharray="5 3"/>
    <path d="M 328 128 C 290 142, 252 158, 214 176" fill="none" stroke="rgba(0,0,0,${d(0.18)})" stroke-width="1.2" stroke-dasharray="4 3"/>
    <g filter="url(#b14)">
      <path d="M 194 440 C 236 470, 262 522, 268 592" fill="none" stroke="rgba(0,0,0,${d(0.11)})" stroke-width="22"/>
      <path d="M 198 570 C 232 610, 246 668, 240 750" fill="none" stroke="rgba(0,0,0,${d(0.07)})" stroke-width="30"/>
      <path d="M 226 450 C 262 492, 286 544, 292 604" fill="none" stroke="rgba(255,255,255,${k(0.06)})" stroke-width="14"/>
      <path d="M 120 250 C 100 300, 86 340, 74 372" fill="none" stroke="rgba(255,255,255,${k(0.05)})" stroke-width="16"/>
    </g>`;

  return `<svg ${NS} viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${VIEW_W}" height="${VIEW_H}">
  <defs>
    <clipPath id="c"><path d="${o}"/></clipPath>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="${k(0.10)}"/>
      <stop offset=".42" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${d(0.17)}"/>
    </linearGradient>
    <linearGradient id="h" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="${d(0.22)}"/>
      <stop offset=".17" stop-color="#000" stop-opacity="${d(0.07)}"/>
      <stop offset=".32" stop-color="#000" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="${k(0.035)}"/>
      <stop offset=".68" stop-color="#000" stop-opacity="0"/>
      <stop offset=".83" stop-color="#000" stop-opacity="${d(0.07)}"/>
      <stop offset="1" stop-color="#000" stop-opacity="${d(0.22)}"/>
    </linearGradient>
    <linearGradient id="sl" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="${k(0.04)}"/>
      <stop offset="1" stop-color="#000" stop-opacity="${d(0.07)}"/>
    </linearGradient>
    <filter id="b14" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="b6" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="tex" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .13 -.02"/>
    </filter>
    <g id="L">${half}</g>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#v)"/>
    <rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#h)"/>
    <use href="#L" xlink:href="#L"/>
    <use href="#L" xlink:href="#L" transform="translate(800 0) scale(-1 1)"/>
    <g filter="url(#b14)">
      <ellipse cx="400" cy="400" rx="95" ry="210" fill="rgba(255,255,255,${k(0.035)})"/>
      <path d="M 300 700 C 360 730, 440 730, 500 700" fill="none" stroke="rgba(0,0,0,${d(0.06)})" stroke-width="26"/>
      <path d="M 186 884 Q 400 906 614 884" fill="none" stroke="rgba(0,0,0,${d(0.14)})" stroke-width="18"/>
    </g>
    <path d="M 182 872 Q 400 889 618 872" fill="none" stroke="rgba(0,0,0,${d(0.30)})" stroke-width="1.5" stroke-dasharray="5 3"/>
    <path d="${o}" fill="none" stroke="rgba(0,0,0,${d(0.38)})" stroke-width="12" filter="url(#b6)"/>
    <rect width="${VIEW_W}" height="${VIEW_H}" filter="url(#tex)"/>
  </g>
</svg>`;
}

export const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Could not prepare the mockup image."));
    i.src = src;
  });
}

/** Renders one side of the shirt with the artwork on it to a JPEG file (1200x1500). */
export async function renderMockupFile(color: ShirtColor, side: Side, layer: Layer): Promise<File> {
  const hex = SHIRT_COLORS[color];
  const S = 1.5;
  const canvas = document.createElement("canvas");
  canvas.width = VIEW_W * S;
  canvas.height = VIEW_H * S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare mockup.");
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const [base, shade] = await Promise.all([
    loadImage(svgUrl(shirtBaseSvg(hex, side))),
    loadImage(svgUrl(shirtShadeSvg(hex, side))),
  ]);
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
  if (layer.art) {
    const art = await loadImage(layer.art);
    const { w, h } = artSize(side, layer);
    const p = PRINT[side];
    ctx.save();
    ctx.translate((p.cx + layer.x) * S, (p.cy + layer.y) * S);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.drawImage(art, (-w / 2) * S, (-h / 2) * S, w * S, h * S);
    ctx.restore();
  }
  ctx.drawImage(shade, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
  if (!blob) throw new Error("Could not create mockup.");
  return new File([blob], `set-apart-mockup-${side}.jpg`, { type: "image/jpeg" });
}

/** Back/front data stored inside custom_designs.transform (JSON). Older rows hold a flat {scale,rotation,x,y}. */
export type StoredSide = { artworkUrl: string | null; mockupUrl: string | null };
export function readDesignSides(d: { artworkUrl?: string | null; mockupUrl?: string | null; transform?: string | null }): { front: StoredSide; back: StoredSide | null } {
  let t: any = null;
  try {
    t = d.transform ? JSON.parse(d.transform) : null;
  } catch {
    t = null;
  }
  const b = t?.back;
  return {
    front: { artworkUrl: d.artworkUrl ?? null, mockupUrl: d.mockupUrl ?? null },
    back: b && (b.artworkUrl || b.mockupUrl) ? { artworkUrl: b.artworkUrl ?? null, mockupUrl: b.mockupUrl ?? null } : null,
  };
}
