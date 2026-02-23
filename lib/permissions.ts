// Permisos disponibles en el sistema
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",

  // Productos
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_EDIT: "products:edit",
  PRODUCTS_DELETE: "products:delete",

  // Categorías
  CATEGORIES_CREATE: "categories:create",
  CATEGORIES_EDIT: "categories:edit",
  CATEGORIES_DELETE: "categories:delete",

  // Reportes
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",

  // Caja
  CASH_MOVEMENTS_DELETE: "cash_movements:delete",

  // Auditoría
  AUDIT_VIEW: "audit:view",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Agrupación por módulo para la UI
export interface PermissionGroup {
  label: string
  permissions: {
    key: Permission
    label: string
    description: string
  }[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Dashboard",
    permissions: [
      {
        key: PERMISSIONS.DASHBOARD_VIEW,
        label: "Ver panel de inicio",
        description: "Acceder al panel principal con resumen del negocio",
      },
    ],
  },
  {
    label: "Productos",
    permissions: [
      {
        key: PERMISSIONS.PRODUCTS_VIEW,
        label: "Ver productos",
        description: "Ver el listado de productos",
      },
      {
        key: PERMISSIONS.PRODUCTS_CREATE,
        label: "Crear productos",
        description: "Agregar nuevos productos al inventario",
      },
      {
        key: PERMISSIONS.PRODUCTS_EDIT,
        label: "Editar productos",
        description: "Modificar productos existentes",
      },
      {
        key: PERMISSIONS.PRODUCTS_DELETE,
        label: "Eliminar productos",
        description: "Desactivar productos del inventario",
      },
    ],
  },
  {
    label: "Categorías",
    permissions: [
      {
        key: PERMISSIONS.CATEGORIES_CREATE,
        label: "Crear categorías",
        description: "Agregar nuevas categorías de productos",
      },
      {
        key: PERMISSIONS.CATEGORIES_EDIT,
        label: "Editar categorías",
        description: "Modificar categorías existentes",
      },
      {
        key: PERMISSIONS.CATEGORIES_DELETE,
        label: "Eliminar categorías",
        description: "Desactivar categorías de productos",
      },
    ],
  },
  {
    label: "Reportes",
    permissions: [
      {
        key: PERMISSIONS.REPORTS_VIEW,
        label: "Ver reportes",
        description: "Acceder a los reportes de ventas",
      },
      {
        key: PERMISSIONS.REPORTS_EXPORT,
        label: "Exportar reportes",
        description: "Descargar reportes en formato Excel",
      },
    ],
  },
  {
    label: "Caja",
    permissions: [
      {
        key: PERMISSIONS.CASH_MOVEMENTS_DELETE,
        label: "Eliminar movimientos",
        description: "Eliminar movimientos de caja registrados",
      },
    ],
  },
  {
    label: "Auditoría",
    permissions: [
      {
        key: PERMISSIONS.AUDIT_VIEW,
        label: "Ver auditoría",
        description: "Acceder al panel de auditoría",
      },
    ],
  },
]

// Todas las claves de permisos válidas
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)

/**
 * Verifica si una sesión tiene un permiso específico.
 * Los admins siempre tienen todos los permisos.
 */
export function hasPermission(
  session: { role: string; permissions?: string[] } | null,
  permission: Permission
): boolean {
  if (!session) return false
  if (session.role === "admin") return true
  return session.permissions?.includes(permission) ?? false
}

/**
 * Mapeo de rutas a permisos requeridos.
 * Las rutas no listadas aquí son accesibles para todos los usuarios autenticados.
 * /dashboard/usuarios es siempre exclusivo del admin (no usa permisos).
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard/products": PERMISSIONS.PRODUCTS_VIEW,
  "/dashboard/reports": PERMISSIONS.REPORTS_VIEW,
  "/dashboard/audit": PERMISSIONS.AUDIT_VIEW,
}

// Rutas exclusivas del admin (no se pueden delegar con permisos)
export const ADMIN_ONLY_ROUTES = ["/dashboard/usuarios"]
