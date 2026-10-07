import * as React from "react";

export type CartLine = {
  productId: number;
  variantId: number;
  customDesignId?: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

type CartState = { lines: CartLine[] };
type Ctx = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: number, variantId: number, quantity: number) => void;
  removeItem: (productId: number, variantId: number) => void;
  clear: () => void;
};

const KEY = "set_apart_cart_v2";
const C = React.createContext<Ctx | null>(null);
const same = (a: CartLine, productId: number, variantId: number) =>
  a.productId === productId && a.variantId === variantId;

function load(): CartState {
  if (typeof window === "undefined") return { lines: [] };
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || "null");
    return Array.isArray(x?.lines) ? x : { lines: [] };
  } catch {
    return { lines: [] };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CartState>(() => load());

  React.useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Cart still works for the current session if storage is unavailable.
    }
  }, [state]);

  const addItem = React.useCallback<Ctx["addItem"]>((item, quantity = 1) => {
    setState((s) => {
      const existing = s.lines.find((x) => same(x, item.productId, item.variantId));
      if (existing) {
        return {
          lines: s.lines.map((x) =>
            same(x, item.productId, item.variantId)
              ? { ...x, quantity: x.quantity + quantity }
              : x,
          ),
        };
      }
      return { lines: [...s.lines, { ...item, quantity }] };
    });
  }, []);

  const updateQuantity = React.useCallback<Ctx["updateQuantity"]>((productId, variantId, quantity) => {
    setState((s) => ({
      lines:
        quantity <= 0
          ? s.lines.filter((x) => !same(x, productId, variantId))
          : s.lines.map((x) =>
              same(x, productId, variantId) ? { ...x, quantity } : x,
            ),
    }));
  }, []);

  const removeItem = React.useCallback<Ctx["removeItem"]>(
    (productId, variantId) => updateQuantity(productId, variantId, 0),
    [updateQuantity],
  );

  const clear = React.useCallback(() => setState({ lines: [] }), []);
  const itemCount = state.lines.reduce((sum, x) => sum + x.quantity, 0);
  const subtotal = state.lines.reduce((sum, x) => sum + x.price * x.quantity, 0);

  return (
    <C.Provider value={{ lines: state.lines, itemCount, subtotal, addItem, updateQuantity, removeItem, clear }}>
      {children}
    </C.Provider>
  );
}

export function useCart() {
  const x = React.useContext(C);
  if (!x) throw new Error("useCart must be used within CartProvider");
  return x;
}
