"use client";

import { AnimatePresence, motion } from "framer-motion";

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-5 right-5 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg"
          role="status"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
