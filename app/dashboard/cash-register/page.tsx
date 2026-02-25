import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { isFeatureEnabled } from "@/lib/features"
import { CashRegisterControl } from "@/components/cash-register-control"

export default async function CashRegisterPage() {
  if (!isFeatureEnabled("cash_register")) redirect("/dashboard")

  const session = await getSession()

  return <CashRegisterControl user={session} />
}
