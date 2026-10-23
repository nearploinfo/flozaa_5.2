"use client";

import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MoonIcon, SunIcon } from "@/components/icons/icons";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    const initial = document.documentElement.classList.contains("dark") ? "dark" : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from DOM class set by the theme init script, not derivable from props/state
    setThemeState(initial);
  }, []);

  const handleChange = (value: string) => {
    if (!value) return;
    const next = value as "light" | "dark";
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("edemand-theme", next);
  };

  return (
    <ToggleGroup type="single" value={theme} onValueChange={handleChange}>
      <ToggleGroupItem value="light" aria-label="Light mode">
        <SunIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark mode">
        <MoonIcon className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
