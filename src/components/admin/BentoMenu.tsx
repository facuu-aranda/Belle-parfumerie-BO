"use client";

import Link from "next/link";
import { Package, ShoppingCart } from "lucide-react";

const menuItems = [
  {
    title: "Gestionar Productos",
    description: "Ver listado, editar productos, ajustar stock",
    href: "/admin/dashboard/productos",
    icon: Package,
  },
  {
    title: "Generar Venta",
    description: "Registrar una venta seleccionando productos",
    href: "/admin/dashboard/venta",
    icon: ShoppingCart,
  },
];

export default function BentoMenu() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:border-violet hover:shadow-lg hover:shadow-violet/10"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lavender-light text-violet transition-colors group-hover:bg-violet group-hover:text-btn-primary-text">
            <item.icon className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-foreground">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
