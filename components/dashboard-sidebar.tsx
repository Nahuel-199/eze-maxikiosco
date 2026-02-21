"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Store, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { logout } from "@/lib/auth"
import { navItems } from "@/lib/nav-items"

interface DashboardSidebarProps {
  user: {
    full_name: string
    email: string
    role: string
  }
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    router.refresh()
  }

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || user.role === "admin"
  )

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Store className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-bold">Maxi-Kiosco Admin</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {filteredItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium border-l-[3px] transition-all duration-200 ease-in-out ${
                  active
                    ? "border-l-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-l-transparent hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User info + Logout */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-2">
          <p className="text-sm text-sidebar-foreground/60">Bienvenido,</p>
          <p className="text-sm font-medium truncate">{user.full_name}</p>
          <p className="text-xs text-sidebar-foreground/60 capitalize">
            {user.role}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  )
}
