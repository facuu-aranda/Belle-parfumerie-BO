"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface SuccessDialogProps {
  open: boolean;
  message: string;
  duration?: number;
  onClose: () => void;
}

export default function SuccessDialog({
  open,
  message,
  duration = 1500,
  onClose,
}: SuccessDialogProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 400, delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light"
              >
                <Check className="h-8 w-8 text-success" />
              </motion.div>
              <p className="text-center text-sm font-medium text-foreground">{message}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
