import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-context";

const money = (n: number) => `GH₵${n.toFixed(2)}`;

/** Cart drawer. Wrap any trigger element: <CartSheet><button>Cart</button></CartSheet> */
export function CartSheet({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const [open, setOpen] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);

  React.useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col bg-[#050505] p-0 text-[#ededed] sm:max-w-md">
        <SheetHeader className="border-b border-white/12 px-5 py-4">
          <SheetTitle className="text-2xl font-black tracking-[-.05em]">
            CART ({cart.itemCount})
          </SheetTitle>
        </SheetHeader>

        {cart.lines.length === 0 ? (
          <div className="grid flex-1 place-items-center px-5 text-center">
            <div>
              <p className="text-3xl font-black tracking-[-.05em]">NOTHING HERE YET.</p>
              <Link
                to="/shop"
                onClick={() => setOpen(false)}
                className="mt-5 inline-block rounded-full bg-white px-5 py-3 text-[10px] font-bold tracking-[.15em] text-black"
              >
                BROWSE THE SHOP
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cart.lines.map((line) => (
                <div key={`${line.productId}-${line.variantId}`} className="border border-white/12 bg-[#0d0d10] p-3">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{line.name}</p>
                      <p className="mt-0.5 text-xs text-white/55">
                        {[line.color, line.size].filter(Boolean).join(" / ")} · {money(line.price)} each
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold">{money(line.price * line.quantity)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center border border-white/15">
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(line.productId, line.variantId, line.quantity - 1)}
                        className="grid size-8 place-items-center text-sm font-bold hover:bg-white/5"
                        aria-label={`Decrease ${line.name} quantity`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(line.productId, line.variantId, line.quantity + 1)}
                        className="grid size-8 place-items-center text-sm font-bold hover:bg-white/5"
                        aria-label={`Increase ${line.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.removeItem(line.productId, line.variantId)}
                      className="text-[10px] font-bold tracking-[.12em] text-white/60 hover:text-white"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/12 bg-[#050505] px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/62">Subtotal</span>
                <span className="text-lg font-black">{money(cart.subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-white/50">Delivery fee is added at checkout.</p>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="mt-4 block w-full rounded-full bg-white py-4 text-center text-xs font-bold tracking-[.15em] text-black"
              >
                CHECKOUT
              </Link>
              {confirmClear ? (
                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold">Remove everything?</span>
                  <span className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        cart.clear();
                        setConfirmClear(false);
                      }}
                      className="font-bold text-red-400 underline"
                    >
                      YES, CLEAR
                    </button>
                    <button type="button" onClick={() => setConfirmClear(false)} className="font-bold underline">
                      CANCEL
                    </button>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-[10px] font-bold tracking-[.15em] text-white/62 hover:text-white"
                >
                  <Trash2 size={13} /> CLEAR CART
                </button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
