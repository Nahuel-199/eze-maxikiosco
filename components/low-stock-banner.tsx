import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LowStockBannerProps {
  count: number
}

export function LowStockBanner({ count }: LowStockBannerProps) {
  return (
    <Link
      href="/dashboard/products?lowStock=true"
      className="flex items-center gap-3 p-3 sm:p-4 mb-6 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {count === 1
            ? "1 producto necesita reposición"
            : `${count} productos necesitan reposición`}
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
          Hacé click para ver los productos con stock bajo
        </p>
      </div>
      <Badge
        variant="outline"
        className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 shrink-0"
      >
        {count}
      </Badge>
    </Link>
  )
}
