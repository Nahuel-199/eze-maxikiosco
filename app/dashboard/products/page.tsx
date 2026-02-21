import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { ProductManagement } from "@/components/product-management"

export default async function ProductsPage() {
  const session = await getSession()

  if (session.role !== "admin") {
    redirect("/dashboard")
  }

  return <ProductManagement />
}
