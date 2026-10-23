// Runs before hydration to apply the persisted light/dark theme synchronously,
// avoiding a flash of the wrong theme (and matching theme-colors-init-script.ts's
// approach for the same reason: this can't wait on redux-persist's async rehydration).
export const themeInitScript = `(function () {
  try {
    var stored = localStorage.getItem("edemand-theme");
    if (stored === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();`;
