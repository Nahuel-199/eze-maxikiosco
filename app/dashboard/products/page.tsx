import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { isFeatureEnabled } from "@/lib/features"
import { ProductManagement } from "@/components/product-management"

export default async function ProductsPage() {
  if (!isFeatureEnabled("products")) redirect("/dashboard")

  const session = await getSession()

  if (!hasPermission(session, PERMISSIONS.PRODUCTS_VIEW)) {
    redirect("/dashboard")
  }

  return <ProductManagement />
}
