import { getSession } from "@/lib/auth"
import { POSSystem } from "@/components/pos-system"

export default async function POSPage() {
  const session = await getSession()

  return <POSSystem user={session} />
}
