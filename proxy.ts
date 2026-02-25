import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Mapeo de rutas a permisos requeridos
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/dashboard/products": "products:view",
  "/dashboard/reports": "reports:view",
  "/dashboard/audit": "audit:view",
}

// Rutas exclusivas del admin (no delegables con permisos)
const ADMIN_ONLY_PATHS = ["/dashboard/usuarios"]

const EMPLOYEE_HOME = "/dashboard/pos"

function getSession(request: NextRequest): { role: string; permissions?: string[] } | null {
  const sessionCookie = request.cookies.get("session")
  if (!sessionCookie) return null
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")
  const { pathname } = request.nextUrl

  // Public routes
  if (pathname === "/login") {
    if (sessionCookie) {
      const session = getSession(request)
      const redirectTo = session?.role === "admin" ? "/dashboard" : EMPLOYEE_HOME
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return NextResponse.next()
  }

  // Protected routes
  if (!sessionCookie && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const session = getSession(request)

  // Admin has full access
  if (session?.role === "admin") {
    return NextResponse.next()
  }

  // Admin-only routes (never delegable)
  if (ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL(EMPLOYEE_HOME, request.url))
  }

  // Dashboard home requires permission
  if (pathname === "/dashboard") {
    if (!session?.permissions?.includes("dashboard:view")) {
      return NextResponse.redirect(new URL(EMPLOYEE_HOME, request.url))
    }
    return NextResponse.next()
  }

  // Check route-level permissions
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      if (!session?.permissions?.includes(permission)) {
        return NextResponse.redirect(new URL(EMPLOYEE_HOME, request.url))
      }
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$).*)"],
}
