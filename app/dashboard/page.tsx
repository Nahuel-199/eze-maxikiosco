import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { getDashboardData } from "@/lib/actions/dashboard"
import { DashboardOverview } from "@/components/dashboard-overview"
import { LowStockBanner } from "@/components/low-stock-banner"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function DashboardContent({ canViewProducts }: { canViewProducts: boolean }) {
  const data = await getDashboardData()

  return (
    <>
      {canViewProducts && data.lowStockProducts.length > 0 && (
        <LowStockBanner count={data.lowStockProducts.length} />
      )}
      <DashboardOverview data={data} />
    </>
  )
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!hasPermission(session, PERMISSIONS.DASHBOARD_VIEW)) {
    redirect("/dashboard/pos")
  }

  const canViewProducts = hasPermission(session, PERMISSIONS.PRODUCTS_VIEW)

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
          Bienvenido, {session.full_name}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Resumen del negocio
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent canViewProducts={canViewProducts} />
      </Suspense>
    </div>
  )
}
