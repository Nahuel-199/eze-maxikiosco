export type Feature = "pos" | "cash_register" | "products" | "reports" | "audit" | "users"

const FEATURE_ENV_MAP: Record<Feature, string> = {
  pos: "NEXT_PUBLIC_FEATURE_POS",
  cash_register: "NEXT_PUBLIC_FEATURE_CASH_REGISTER",
  products: "NEXT_PUBLIC_FEATURE_PRODUCTS",
  reports: "NEXT_PUBLIC_FEATURE_REPORTS",
  audit: "NEXT_PUBLIC_FEATURE_AUDIT",
  users: "NEXT_PUBLIC_FEATURE_USERS",
}

export const FEATURE_ROUTE_MAP: Record<string, Feature> = {
  "/dashboard/pos": "pos",
  "/dashboard/cash-register": "cash_register",
  "/dashboard/products": "products",
  "/dashboard/reports": "reports",
  "/dashboard/audit": "audit",
  "/dashboard/usuarios": "users",
}

export function isFeatureEnabled(feature: Feature): boolean {
  const envVar = FEATURE_ENV_MAP[feature]
  const value = process.env[envVar]
  // Habilitado por defecto, solo se desactiva con "false"
  return value?.toLowerCase() !== "false"
}
