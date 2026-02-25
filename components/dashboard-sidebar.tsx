"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Store, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { logout } from "@/lib/auth"
import { navItems } from "@/lib/nav-items"
import { hasPermission, type Permission } from "@/lib/permissions"
import { isFeatureEnabled } from "@/lib/features"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Image from "next/image"

interface DashboardSidebarProps {
  user: {
    full_name: string
    email: string
    role: string
    permissions?: string[]
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

  const filteredItems = navItems.filter((item) => {
    if (item.feature && !isFeatureEnabled(item.feature)) return false
    if (item.adminOnly) return user.role === "admin"
    if (item.permission) return hasPermission(user, item.permission as Permission)
    return true
  })

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-16 flex-col border-r bg-sidebar text-sidebar-foreground">
        {/* Logo */}
        <div className="flex h-14 items-center justify-center border-b border-sidebar-border">
          <Link href="/dashboard">
            <Image
              src="/logo360.png"
              alt="Controla360 Logo"
              width={46}
              height={46}
              className="rounded-lg"
            />
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-1 px-2">
            {filteredItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-center rounded-md p-2.5 transition-colors ${active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                        }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Cerrar Sesión
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
