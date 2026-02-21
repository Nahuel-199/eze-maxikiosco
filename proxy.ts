import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_ONLY_PATHS = ["/dashboard/reports", "/dashboard/products", "/dashboard/audit", "/dashboard/usuarios"]
const EMPLOYEE_HOME = "/dashboard/pos"

function getSessionRole(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get("session")
  if (!sessionCookie) return null
  try {
    const session = JSON.parse(sessionCookie.value)
    return session.role ?? null
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const session = request.cookies.get("session")
  const { pathname } = request.nextUrl

  // Public routes
  if (pathname === "/login") {
    if (session) {
      const role = getSessionRole(request)
      const redirectTo = role === "admin" ? "/dashboard" : EMPLOYEE_HOME
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return NextResponse.next()
  }

  // Protected routes
  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Role-based route protection
  const role = getSessionRole(request)

  if (role !== "admin") {
    // Redirect employees from /dashboard (Inicio) to POS
    if (pathname === "/dashboard") {
      return NextResponse.redirect(new URL(EMPLOYEE_HOME, request.url))
    }

    // Block access to admin-only routes
    if (ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL(EMPLOYEE_HOME, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
