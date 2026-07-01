"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Una línea del carrito. La clave única es `variantId` (producto + talla). */
export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  unitPrice: number; // snapshot para mostrar; el checkout recalcula desde BD
  image: string | null;
  quantity: number;
  maxStock: number; // tope para el selector de cantidad
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === item.variantId
          );
          if (existing) {
            const newQty = Math.min(
              existing.quantity + quantity,
              item.maxStock
            );
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: newQty, maxStock: item.maxStock }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: Math.min(quantity, item.maxStock) },
            ],
          };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.variantId === variantId
                ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "gtshop-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selectores derivados (devuelven primitivos -> sin problemas de igualdad).
export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

export const useCartSubtotal = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
