"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, FileText, ImageIcon } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";
import ProductList, { type SortKey, type SortState } from "@/components/admin/ProductList";
import ProductEditModal from "@/components/admin/ProductEditModal";
import { GenderTabs, type TabKey } from "@/components/admin/GenderTabs";
import { CatalogControls, type ActiveFilter } from "@/components/admin/CatalogControls";
import BulkActions from "@/components/admin/BulkActions";
import { Toast } from "@/components/admin/Toast";
import { MotionPage } from "@/components/admin/MotionPage";
import { exportAsTxt, exportAsJpg } from "@/lib/exporters";

function useLocalNum(key: string, fallback: number) {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw != null && raw !== "") {
      const n = Number(raw);
      if (!Number.isNaN(n)) setValue(n);
    }
  }, [key]);
  useEffect(() => { localStorage.setItem(key, String(value)); }, [key, value]);
  return [value, setValue] as const;
}

function useLocalStr(key: string, fallback: string) {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw != null && raw !== "") setValue(raw);
  }, [key]);
  useEffect(() => { localStorage.setItem(key, value); }, [key, value]);
  return [value, setValue] as const;
}

export default function ProductosPage() {
  const { products, loading } = useProducts();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [tab, setTab] = useLocalStr("bo-tab", "Todos");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [fixedProfit, setFixedProfit] = useLocalNum("bo-fija", 0);
  const [marginPercent, setMarginPercent] = useLocalNum("bo-margen", 0);

  // Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // Sort
  const [sort, setSort] = useState<SortState>({ key: null, asc: true });

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Filtered + sorted rows
  const rows = useMemo(() => {
    const t = tab as TabKey;
    let r = products.filter((p) => {
      const matchName = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
                        p.marca.toLowerCase().includes(search.toLowerCase());
      const matchTab = t === "Todos" || p.genero === t;
      const matchActive = activeFilter === "all" || (activeFilter === "active" ? p.active : !p.active);
      return matchName && matchTab && matchActive;
    });

    if (sort.key) {
      const key = sort.key;
      r = [...r].sort((a, b) => {
        if (key === "nombre") {
          const c = a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
          return sort.asc ? c : -c;
        }
        if (key === "marca") {
          const c = a.marca.localeCompare(b.marca, "es", { sensitivity: "base" });
          return sort.asc ? c : -c;
        }
        if (key === "stock") {
          return sort.asc ? a.stock - b.stock : b.stock - a.stock;
        }
        // Price columns
        const priceMap: Record<string, (p: Product) => number> = {
          unitario: (p) => p.precios?.unitario ?? 0,
          x3: (p) => p.precios?.mayorista_3 ?? 0,
          x10: (p) => p.precios?.mayorista_10 ?? 0,
          decant: (p) => p.precios?.decant ?? 0,
        };
        const getter = priceMap[key];
        if (getter) {
          const av = getter(a);
          const bv = getter(b);
          return sort.asc ? av - bv : bv - av;
        }
        return 0;
      });
    }

    return r;
  }, [products, search, sort.asc, sort.key, tab, activeFilter]);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditProduct(null);
  };

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelected(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((p) => p.id)));
    }
  };

  const exportRows = selected.size > 0
    ? products.filter((p) => selected.has(p.id))
    : rows;

  return (
    <MotionPage>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-lavender-light hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-foreground">Gestionar Productos</h2>
              <p className="text-xs text-muted-foreground">
                {products.length} producto{products.length !== 1 ? "s" : ""} en total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await exportAsTxt({ rows: exportRows, fixedProfit, marginPercent });
                setToast("Texto copiado al portapapeles");
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-lavender-light hover:text-foreground"
              title="Copiar como texto"
            >
              <FileText className="h-3.5 w-3.5" />
              TXT
            </button>
            <button
              type="button"
              onClick={() => {
                exportAsJpg({ rows: exportRows, fixedProfit, marginPercent });
                setToast("Imagen exportada");
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-lavender-light hover:text-foreground"
              title="Descargar como imagen"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              IMG
            </button>
            <button
              onClick={handleAdd}
              className="flex h-9 items-center gap-2 rounded-xl bg-btn-primary px-4 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Tabs + Controls */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <GenderTabs value={tab as TabKey} onChange={(t) => setTab(t)} />
          <CatalogControls
            search={search}
            onSearch={setSearch}
            activeFilter={activeFilter}
            onActiveFilter={setActiveFilter}
            fixedProfit={fixedProfit}
            onFixedProfit={setFixedProfit}
            marginPercent={marginPercent}
            onMarginPercent={setMarginPercent}
            selectMode={selectMode}
            onToggleSelectMode={toggleSelectMode}
          />
        </section>

        {/* Bulk actions */}
        {selectMode && (
          <BulkActions
            selected={selected}
            products={products}
            onDone={(msg) => {
              setToast(msg);
              setSelected(new Set());
              setSelectMode(false);
            }}
          />
        )}

        {/* Product table */}
        <ProductList
          rows={rows}
          loading={loading}
          onEdit={handleEdit}
          selectMode={selectMode}
          selected={selected}
          onToggleSelected={toggleSelected}
          onSelectAll={selectAll}
          sort={sort}
          onSort={(key: SortKey) => setSort((s) => ({ key, asc: s.key === key ? !s.asc : true }))}
          fixedProfit={fixedProfit}
          marginPercent={marginPercent}
        />

        {selectMode && selected.size === 0 && (
          <p className="text-xs text-muted-foreground">
            Seleccioná filas para aplicar acciones en lote. Si no seleccionás nada, la exportación incluye todo.
          </p>
        )}
      </div>

      <ProductEditModal
        open={modalOpen}
        product={editProduct}
        onClose={handleClose}
      />

      <Toast message={toast} />
    </MotionPage>
  );
}
