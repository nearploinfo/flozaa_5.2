// Runs before hydration to apply persisted theme colors synchronously,
// avoiding a flash of the globals.css fallback palette. redux-persist's
// rehydration is promise-based and resolves after first paint, so reading
// its localStorage key directly here is the only way to beat that flash.
export const themeColorsInitScript = `(function () {
  try {
    var raw = localStorage.getItem("persist:edemand-root");
    if (!raw) return;
    var persisted = JSON.parse(raw);
    if (!persisted.themeColors) return;
    var data = JSON.parse(persisted.themeColors).data;
    if (!data) return;

    var scaleMap = { primary: "primary", neutral: "neutral", success: "success", error: "error", warn: "warning", info: "info" };
    var shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    var root = document.documentElement;

    for (var apiKey in scaleMap) {
      var scale = data[apiKey];
      if (!scale) continue;
      var cssScale = scaleMap[apiKey];
      for (var i = 0; i < shades.length; i++) {
        var value = scale[String(shades[i])];
        if (value) root.style.setProperty("--color-" + cssScale + "-" + shades[i], value);
      }
    }

    // Same reasoning as applyThemeColors() in theme-colors.ts — correct the
    // OS status/toolbar color (manifest.json's static default) to the
    // persisted brand color before first paint, so returning visitors never
    // see a flash of the default blue.
    var primary500 = data.primary && data.primary["500"];
    if (primary500) {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", primary500);
    }
  } catch (e) {}
})();`;
