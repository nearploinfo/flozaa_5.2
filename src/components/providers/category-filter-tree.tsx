"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { CategoryTreeNode } from "@/lib/categories-tree-api";
import { AppButton } from "@/components/ui/app-button";

function CategoryTreeItem({
  node,
  depth,
  selected,
  onToggleSelect,
}: {
  node: CategoryTreeNode;
  depth: number;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = Boolean(node.children?.length);
  const Icon = expanded ? Minus : Plus;

  return (
    <div className="flex flex-col gap-3" style={{ paddingLeft: depth * 24 }}>
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <AppButton
            variant="link"
            size="sm"
            iconOnly
            leftIcon={Icon}
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            onClick={() => setExpanded((value) => !value)}
            className="size-4 shrink-0 p-0 text-icon-primary"
          >
            {expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          </AppButton>
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-bg-secondary">
          <span className="flex-1 text-sm text-text-primary">{node.name}</span>
          <input
            type="checkbox"
            checked={selected.has(node.slug)}
            onChange={() => onToggleSelect(node.slug)}
            className="size-4 shrink-0 cursor-pointer rounded-sm border border-border-strong accent-bg-brand transition-transform duration-150 active:scale-90"
          />
        </label>
      </div>

      {hasChildren && (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3">
                {node.children!.map((child) => (
                  <CategoryTreeItem
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    selected={selected}
                    onToggleSelect={onToggleSelect}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export function CategoryFilterTree({
  categories,
  selected,
  onToggleSelect,
}: {
  categories: CategoryTreeNode[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {categories.map((category) => (
        <CategoryTreeItem
          key={category.id}
          node={category}
          depth={0}
          selected={selected}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
