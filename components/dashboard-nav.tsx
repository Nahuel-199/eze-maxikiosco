"use client"

import { useState } from "react"
import { Store, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { navItems } from "@/lib/nav-items"

interface DashboardNavProps {
  user: {
    full_name: string
    email: string
    role: string
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    router.refresh()
  }

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || user.role === "admin"
  )

  return (
    <header className="border-b bg-card sticky top-0 z-50 lg:hidden">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-lg sm:text-xl font-bold">Maxi-Kiosco</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Maxi-Kiosco Admin
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Bienvenido,</p>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
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
  )
}
