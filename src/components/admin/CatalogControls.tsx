"use client";

import { Search } from "lucide-react";

export type ActiveFilter = "all" | "active" | "inactive";

export function CatalogControls({
  search,
  onSearch,
  activeFilter,
  onActiveFilter,
  fixedProfit,
  onFixedProfit,
  marginPercent,
  onMarginPercent,
  selectMode,
  onToggleSelectMode,
}: {
  search: string;
  onSearch: (v: string) => void;
  activeFilter: ActiveFilter;
  onActiveFilter: (v: ActiveFilter) => void;
  fixedProfit: number;
  onFixedProfit: (v: number) => void;
  marginPercent: number;
  onMarginPercent: (v: number) => void;
  selectMode: boolean;
  onToggleSelectMode: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar perfume..."
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-violet"
        />
      </div>

      <select
        value={activeFilter}
        onChange={(e) => onActiveFilter(e.target.value as ActiveFilter)}
        className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-violet"
      >
        <option value="all">Todos</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>

      <input
        value={Number.isFinite(fixedProfit) && fixedProfit !== 0 ? String(fixedProfit) : ""}
        onChange={(e) => onFixedProfit(Number(e.target.value) || 0)}
        type="number"
        inputMode="numeric"
        placeholder="Ganancia fija ($)"
        className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-violet"
      />

      <input
        value={Number.isFinite(marginPercent) && marginPercent !== 0 ? String(marginPercent) : ""}
        onChange={(e) => onMarginPercent(Number(e.target.value) || 0)}
        type="number"
        inputMode="numeric"
        placeholder="Margen %"
        className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-violet"
      />

      <button
        type="button"
        onClick={onToggleSelectMode}
        className={
          selectMode
            ? "h-11 rounded-xl border-2 border-violet bg-transparent px-3 text-sm font-medium text-violet"
            : "h-11 rounded-xl bg-violet px-3 text-sm font-medium text-btn-primary-text"
        }
      >
        {selectMode ? "Cancelar selección" : "Seleccionar"}
      </button>
    </div>
  );
}
