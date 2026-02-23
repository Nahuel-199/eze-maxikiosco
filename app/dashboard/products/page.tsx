import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { ProductManagement } from "@/components/product-management"

export default async function ProductsPage() {
  const session = await getSession()

  if (!hasPermission(session, PERMISSIONS.PRODUCTS_VIEW)) {
    redirect("/dashboard")
  }

  return <ProductManagement />
}
