"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
              <p className="mb-6 text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${
                    variant === "danger"
                      ? "bg-danger hover:bg-red-700"
                      : "bg-btn-primary hover:bg-btn-primary-hover"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
