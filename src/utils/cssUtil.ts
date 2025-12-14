export function css(name: string, fallback: string): string {
  // Read the CSS variable value from the root element (:root)
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  // Trim whitespace and handle undefined/empty values
  const s = typeof v === "string" ? v.trim() : "";
  // Return fallback if variable is not defined or empty
  return s === "" ? fallback : s;
}
