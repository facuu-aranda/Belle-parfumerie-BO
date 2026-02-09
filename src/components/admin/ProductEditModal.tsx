"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ref, set, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import type { Product, Gender, Style, Temporada, Horario, Ocasion, Edad } from "@/types/product";
import ImageUploader from "./ImageUploader";
import ConfirmDialog from "./ConfirmDialog";
import SuccessDialog from "./SuccessDialog";

const GENDERS: Gender[] = ["Masculino", "Femenino", "Unisex"];
const STYLES: Style[] = ["Designer", "Arabe"];
const TEMPORADAS: Temporada[] = ["Primavera", "Verano", "Otoño", "Invierno"];
const HORARIOS: Horario[] = ["Mañana", "Tarde", "Noche"];
const OCASIONES: Ocasion[] = ["Casual", "Formal", "Trabajo", "Cita", "Fiesta", "Deporte"];
const EDADES: Edad[] = ["Juvenil", "Joven", "Adulto", "Todos"];
const CONCENTRACIONES = ["EDP", "EDT", "Extrait de Parfum", "Parfum"];

function emptyProduct(): Product {
  return {
    id: uuidv4(),
    nombre: "",
    label: null,
    marca: "",
    genero: "Unisex",
    estilo: "Designer",
    concentracion: null,
    volumen: null,
    imagen: null,
    notas: "",
    costo: null,
    temporadas: [],
    horarios: [],
    ocasiones: [],
    versatilidad: 3,
    edades: ["Todos"],
    precios: { unitario: null, mayorista_3: null, mayorista_10: null, decant: null },
    stock: 0,
    oferta: null,
    active: true,
  };
}

interface ProductEditModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

export default function ProductEditModal({ open, product, onClose }: ProductEditModalProps) {
  const isNew = !product;
  const [form, setForm] = useState<Product>(product ?? emptyProduct());
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const session = getSession();
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        precios: product.precios ?? { unitario: null, mayorista_3: null, mayorista_10: null, decant: null },
      });
    } else {
      setForm(emptyProduct());
    }
  }, [product, open]);

  const updateField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayField = <T,>(arr: T[], value: T): T[] => {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  };

  const handleSave = async () => {
    setConfirmSave(false);
    setSaving(true);
    try {
      await set(ref(db, "perfumes/" + form.id), form);
      setSuccessMsg(isNew ? "Producto creado correctamente" : "Cambios guardados correctamente");
      setShowSuccess(true);
    } catch (err) {
      console.error("Error guardando producto:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    setSaving(true);
    try {
      await remove(ref(db, "perfumes/" + form.id));
      setSuccessMsg("Producto eliminado correctamente");
      setShowSuccess(true);
    } catch (err) {
      console.error("Error eliminando producto:", err);
    }
    setSaving(false);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-4 z-50 mx-auto flex max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-lg font-bold text-foreground">
                  {isNew ? "Nuevo Producto" : `Editar: ${form.nombre}`}
                </h3>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-rose-light hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Nombre *</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => updateField("nombre", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                      required
                    />
                  </div>

                  {/* Marca */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Marca *</label>
                    <input
                      type="text"
                      value={form.marca}
                      onChange={(e) => updateField("marca", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                      required
                    />
                  </div>

                  {/* Label */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Label (etiqueta)</label>
                    <input
                      type="text"
                      value={form.label ?? ""}
                      onChange={(e) => updateField("label", e.target.value || null)}
                      placeholder="Ej: Nuevo, Bestseller, Exclusivo"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                    />
                  </div>

                  {/* Género */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Género *</label>
                    <select
                      value={form.genero}
                      onChange={(e) => updateField("genero", e.target.value as Gender)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                    >
                      {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Estilo */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Estilo *</label>
                    <select
                      value={form.estilo}
                      onChange={(e) => updateField("estilo", e.target.value as Style)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                    >
                      {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Concentración */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Concentración</label>
                    <select
                      value={form.concentracion ?? ""}
                      onChange={(e) => updateField("concentracion", e.target.value || null)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                    >
                      <option value="">Sin especificar</option>
                      {CONCENTRACIONES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Volumen */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Volumen</label>
                    <input
                      type="text"
                      value={form.volumen ?? ""}
                      onChange={(e) => updateField("volumen", e.target.value || null)}
                      placeholder="Ej: 100ml"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={form.stock}
                      onChange={(e) => updateField("stock", parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                    />
                  </div>

                  {/* Activo */}
                  <div className="flex items-center gap-3 self-end rounded-xl border border-border bg-background px-4 py-2.5">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => updateField("active", e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-5 w-9 rounded-full bg-muted-foreground/30 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-violet peer-checked:after:translate-x-full" />
                    </label>
                    <span className={`text-sm font-semibold ${form.active ? "text-foreground" : "text-muted-foreground"}`}>
                      {form.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                {/* Imagen */}
                <div className="mt-5">
                  <ImageUploader
                    currentUrl={form.imagen}
                    onUpload={(url) => updateField("imagen", url)}
                  />
                </div>

                {/* Notas */}
                <div className="mt-5 space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground">Notas olfativas / Descripción</label>
                  <textarea
                    value={form.notas}
                    onChange={(e) => updateField("notas", e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                  />
                </div>

                {/* Costo — solo admin */}
                {isAdmin && (
                  <div className="mt-5 space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground">Costo de adquisición (solo admin)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.costo ?? ""}
                      onChange={(e) => updateField("costo", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="$"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                    />
                  </div>
                )}

                {/* Precios */}
                <div className="mt-5">
                  <h4 className="mb-3 text-sm font-bold text-foreground">Precios (ARS)</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {([
                      ["unitario", "Unitario"],
                      ["mayorista_3", "Mayorista x3"],
                      ["mayorista_10", "Mayorista x10"],
                      ["decant", "Decant"],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground">{label}</label>
                        <input
                          type="number"
                          min={0}
                          value={form.precios[key] ?? ""}
                          onChange={(e) =>
                            updateField("precios", {
                              ...form.precios,
                              [key]: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          placeholder="$"
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-selects */}
                <div className="mt-5 space-y-4">
                  {/* Temporadas */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-muted-foreground">Temporadas</label>
                    <div className="flex flex-wrap gap-2">
                      {TEMPORADAS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateField("temporadas", toggleArrayField(form.temporadas, t))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            form.temporadas.includes(t)
                              ? "border-violet bg-violet text-btn-primary-text"
                              : "border-border text-muted-foreground hover:border-violet"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Horarios */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-muted-foreground">Horarios</label>
                    <div className="flex flex-wrap gap-2">
                      {HORARIOS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => updateField("horarios", toggleArrayField(form.horarios, h))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            form.horarios.includes(h)
                              ? "border-violet bg-violet text-btn-primary-text"
                              : "border-border text-muted-foreground hover:border-violet"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ocasiones */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-muted-foreground">Ocasiones</label>
                    <div className="flex flex-wrap gap-2">
                      {OCASIONES.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => updateField("ocasiones", toggleArrayField(form.ocasiones, o))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            form.ocasiones.includes(o)
                              ? "border-violet bg-violet text-btn-primary-text"
                              : "border-border text-muted-foreground hover:border-violet"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edades */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-muted-foreground">Edades</label>
                    <div className="flex flex-wrap gap-2">
                      {EDADES.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => updateField("edades", toggleArrayField(form.edades, e))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            form.edades.includes(e)
                              ? "border-violet bg-violet text-btn-primary-text"
                              : "border-border text-muted-foreground hover:border-violet"
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Versatilidad */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                      Versatilidad: {form.versatilidad}/5
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={form.versatilidad}
                      onChange={(e) => updateField("versatilidad", parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                      className="w-full accent-violet"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Específico</span>
                      <span>Muy versátil</span>
                    </div>
                  </div>
                </div>

                {/* Oferta */}
                <div className="mt-5 rounded-xl border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">Oferta</h4>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.oferta?.activa ?? false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateField("oferta", {
                              activa: true,
                              precioOferta: null,
                              porcentajeDesc: null,
                              etiqueta: "",
                              desde: null,
                              hasta: null,
                            });
                          } else {
                            updateField("oferta", null);
                          }
                        }}
                        className="accent-violet"
                      />
                      <span className="text-xs text-muted-foreground">Activar oferta</span>
                    </label>
                  </div>

                  {form.oferta?.activa && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground">Precio fijo oferta</label>
                        <input
                          type="number"
                          min={0}
                          value={form.oferta.precioOferta ?? ""}
                          onChange={(e) =>
                            updateField("oferta", {
                              ...form.oferta!,
                              precioOferta: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          placeholder="$"
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground">% Descuento</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={form.oferta.porcentajeDesc ?? ""}
                          onChange={(e) =>
                            updateField("oferta", {
                              ...form.oferta!,
                              porcentajeDesc: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          placeholder="%"
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground">Etiqueta</label>
                        <input
                          type="text"
                          value={form.oferta.etiqueta}
                          onChange={(e) =>
                            updateField("oferta", { ...form.oferta!, etiqueta: e.target.value })
                          }
                          placeholder="Ej: 20% OFF, PROMO"
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground">Desde</label>
                        <input
                          type="date"
                          value={form.oferta.desde ?? ""}
                          onChange={(e) =>
                            updateField("oferta", { ...form.oferta!, desde: e.target.value || null })
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground">Hasta</label>
                        <input
                          type="date"
                          value={form.oferta.hasta ?? ""}
                          onChange={(e) =>
                            updateField("oferta", { ...form.oferta!, hasta: e.target.value || null })
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-violet"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <div>
                  {!isNew && (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={saving}
                      className="rounded-xl border border-danger px-4 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger-light disabled:opacity-50"
                    >
                      Eliminar producto
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setConfirmSave(true)}
                    disabled={saving || !form.nombre || !form.marca}
                    className="rounded-xl bg-btn-primary px-5 py-2 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmSave}
        title="Guardar cambios"
        message={`¿Guardar los cambios en "${form.nombre}"?`}
        onConfirm={handleSave}
        onCancel={() => setConfirmSave(false)}
        confirmLabel="Guardar"
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar producto"
        message={`¿Eliminar "${form.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        confirmLabel="Eliminar"
        variant="danger"
      />

      <SuccessDialog
        open={showSuccess}
        message={successMsg}
        onClose={handleSuccessClose}
      />
    </>
  );
}
