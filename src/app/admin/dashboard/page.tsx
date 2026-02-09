"use client";

import BentoMenu from "@/components/admin/BentoMenu";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Panel de Control</h2>
        <p className="text-sm text-muted-foreground">
          Seleccioná una opción para comenzar
        </p>
      </div>
      <BentoMenu />
    </div>
  );
}
