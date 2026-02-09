"use client";

import { motion } from "framer-motion";
import type { Gender } from "@/types/product";

export type TabKey = "Todos" | Gender;

const tabs: TabKey[] = ["Todos", "Masculino", "Femenino", "Unisex"];

export function GenderTabs({ value, onChange }: { value: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
      {tabs.map((t) => {
        const active = t === value;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className="relative flex-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            type="button"
          >
            {active ? (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg bg-violet"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            ) : null}
            <span className={active ? "relative text-btn-primary-text" : "relative"}>{t}</span>
          </button>
        );
      })}
    </div>
  );
}
