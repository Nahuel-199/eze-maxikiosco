import { getSession } from "@/lib/auth"
import { CashRegisterControl } from "@/components/cash-register-control"

export default async function CashRegisterPage() {
  const session = await getSession()

  return <CashRegisterControl user={session} />
}
