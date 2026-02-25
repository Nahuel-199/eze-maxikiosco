import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { isFeatureEnabled } from "@/lib/features"
import { POSSystem } from "@/components/pos-system"

export default async function POSPage() {
  if (!isFeatureEnabled("pos")) redirect("/dashboard")

  const session = await getSession()

  return <POSSystem user={session} />
}
