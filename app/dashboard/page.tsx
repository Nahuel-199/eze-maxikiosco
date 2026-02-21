import { getSession } from "@/lib/auth"
import { getDashboardData } from "@/lib/actions/dashboard"
import { DashboardOverview } from "@/components/dashboard-overview"

export default async function DashboardPage() {
  const session = await getSession()
  const data = await getDashboardData()

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
      <DashboardOverview data={data} />
    </div>
  )
}
