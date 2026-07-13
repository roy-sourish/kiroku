// The one source of truth — a runtime array
// @NOTE: Add provider name here - 1
export const PROVIDER_NAMES = ["gemini"] as const;
// Derive the TYPE from the array (compile-time guard)
export type ProviderName = (typeof PROVIDER_NAMES)[number];
// Derive a runtime CHECK from the same array (runtime guard)
export function isProviderName(value: unknown): value is ProviderName {
  return (
    typeof value === "string" && PROVIDER_NAMES.includes(value as ProviderName)
  );
}
