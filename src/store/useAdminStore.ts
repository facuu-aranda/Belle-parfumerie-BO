"use client";

import { create } from "zustand";
import type { Product } from "@/types/product";

interface SaleCartItem {
  product: Product;
  cantidad: number;
}

interface AdminState {
  saleCart: SaleCartItem[];
  addToSaleCart: (product: Product) => void;
  removeFromSaleCart: (productId: string) => void;
  updateSaleCartQty: (productId: string, cantidad: number) => void;
  clearSaleCart: () => void;
  getSaleTotal: () => number;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  saleCart: [],

  addToSaleCart: (product) => {
    const { saleCart } = get();
    const existing = saleCart.find((item) => item.product.id === product.id);
    if (existing) {
      set({
        saleCart: saleCart.map((item) =>
          item.product.id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ),
      });
    } else {
      set({ saleCart: [...saleCart, { product, cantidad: 1 }] });
    }
  },

  removeFromSaleCart: (productId) => {
    set((s) => ({
      saleCart: s.saleCart.filter((item) => item.product.id !== productId),
    }));
  },

  updateSaleCartQty: (productId, cantidad) => {
    if (cantidad <= 0) {
      set((s) => ({
        saleCart: s.saleCart.filter((item) => item.product.id !== productId),
      }));
      return;
    }
    set((s) => ({
      saleCart: s.saleCart.map((item) =>
        item.product.id === productId ? { ...item, cantidad } : item
      ),
    }));
  },

  clearSaleCart: () => set({ saleCart: [] }),

  getSaleTotal: () => {
    const { saleCart } = get();
    return saleCart.reduce((acc, item) => {
      const price = item.product.precios?.unitario ?? 0;
      return acc + price * item.cantidad;
    }, 0);
  },
}));
