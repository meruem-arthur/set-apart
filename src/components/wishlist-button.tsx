import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { getWishlistIds, toggleWishlist } from "@/functions/wishlist";

type Props = {
  productId: number;
  /** "icon" = round heart overlay for product cards, "full" = labelled button */
  variant?: "icon" | "full";
  className?: string;
};

export function WishlistButton({ productId, variant = "icon", className = "" }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);
  const q = useQuery({ queryKey: ["wishlist-ids"], queryFn: () => getWishlistIds(), staleTime: 30_000 });
  const saved = q.data?.ids.includes(productId) ?? false;

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (q.data && !q.data.signedIn) {
      toast("Sign in to save items to your wishlist.");
      navigate({ to: "/account" });
      return;
    }
    setBusy(true);
    try {
      const r = await toggleWishlist({ data: { productId } });
      toast.success(r.active ? "Added to wishlist" : "Removed from wishlist");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["wishlist-ids"] }),
        qc.invalidateQueries({ queryKey: ["wishlist"] }),
      ]);
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNAUTHORIZED")) {
        toast("Sign in to save items to your wishlist.");
        navigate({ to: "/account" });
      } else {
        toast.error("Couldn't update your wishlist. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={saved}
        className={`flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-4 text-xs font-bold tracking-[.15em] disabled:opacity-50 ${className}`}
      >
        <Heart size={15} className={saved ? "fill-white" : ""} />
        {saved ? "SAVED TO WISHLIST" : "ADD TO WISHLIST"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={`grid size-9 place-items-center rounded-full bg-black/60 shadow disabled:opacity-50 ${className}`}
    >
      <Heart size={16} className={saved ? "fill-white" : ""} />
    </button>
  );
}
