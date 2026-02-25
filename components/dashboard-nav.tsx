"use client"

import { useState } from "react"
import { LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { navItems } from "@/lib/nav-items"
import { hasPermission, type Permission } from "@/lib/permissions"
import { isFeatureEnabled } from "@/lib/features"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardNavProps {
  user: {
    full_name: string
    email: string
    role: string
    permissions?: string[]
  }
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  employee: "Empleado",
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    router.refresh()
  }

  const filteredItems = navItems.filter((item) => {
    if (item.feature && !isFeatureEnabled(item.feature)) return false
    if (item.adminOnly) return user.role === "admin"
    if (item.permission) return hasPermission(user, item.permission as Permission)
    return true
  })

  return (
    <>
      {/* Desktop navbar */}
      <header className="hidden lg:block border-b bg-card sticky top-0 z-30 pl-16">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Bienvenido,</span>
            <span className="text-sm font-semibold">{user.full_name}</span>
            <Badge
              variant={user.role === "admin" ? "default" : "secondary"}
              className="text-[10px] uppercase tracking-wider"
            >
              {ROLE_LABELS[user.role] || user.role}
            </Badge>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile navbar */}
      <header className="border-b bg-card sticky top-0 z-50 lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo360.png"
              alt="Controla360 Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-bold">Controla360</span>
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Image
                      src="/logo360.png"
                      alt="Controla360 Logo"
                      width={28}
                      height={28}
                      className="rounded-lg"
                    />
                    Controla360
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.full_name}</p>
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                        className="text-[10px] uppercase tracking-wider mt-1"
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </div>
                  </div>
                  <nav className="space-y-2">
                    {filteredItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-muted transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
