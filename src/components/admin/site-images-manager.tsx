import * as React from "react";
import { useRouter } from "@tanstack/react-router";
import { SITE_IMAGE_SLOTS, setSiteImage } from "@/functions/site-images";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary";

export function SiteImagesManager({ images }: { images: Record<string, string | null> }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onFile(slot: (typeof SITE_IMAGE_SLOTS)[number]["slot"], file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(slot);
    try {
      const url = await uploadImageToCloudinary(file);
      await setSiteImage({ data: { slot, url } });
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onRemove(slot: (typeof SITE_IMAGE_SLOTS)[number]["slot"]) {
    setError(null);
    setBusy(slot);
    try {
      await setSiteImage({ data: { slot, url: "" } });
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove image.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site images</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Change the pictures used across the storefront pages. Product photos are managed under Products.
        </p>
      </div>
      {!isCloudinaryConfigured() && (
        <p className="rounded-md bg-amber/10 p-3 text-sm text-amber">
          Uploads need VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to be set.
        </p>
      )}
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      <div className="grid gap-5 md:grid-cols-2">
        {SITE_IMAGE_SLOTS.map((s) => {
          const url = images[s.slot];
          return (
            <div key={s.slot} className="rounded-xl border bg-card p-4">
              <p className="font-semibold">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
              <div className="mt-3 aspect-[16/9] overflow-hidden rounded-lg bg-muted">
                {url ? (
                  <img src={url} alt={s.label} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    Default (no image set)
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="cursor-pointer rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                  {busy === s.slot ? "Working…" : url ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={busy !== null}
                    onChange={(e) => {
                      void onFile(s.slot, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {url && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void onRemove(s.slot)}
                    className="text-xs font-medium text-red-400 underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
