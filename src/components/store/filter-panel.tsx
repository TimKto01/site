"use client";
import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
export function FilterPanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`filter-panel ${open ? "filters-open" : ""}`}>
      <button
        className="filter-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="catalog-filters"
        onClick={() => setOpen(!open)}
      >
        <SlidersHorizontal size={17} />
        <span>Фильтры и сортировка</span>
        <ChevronDown size={17} className={open ? "rotate-180" : ""} />
      </button>
      <div className="filter-content" id="catalog-filters">
        {children}
      </div>
    </div>
  );
}
