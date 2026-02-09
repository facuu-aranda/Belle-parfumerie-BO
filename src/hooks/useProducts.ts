"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Product } from "@/types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const perfumesRef = ref(db, "perfumes");
    const unsubscribe = onValue(perfumesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const list: Product[] = Object.values(data);
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setProducts(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { products, loading };
}
