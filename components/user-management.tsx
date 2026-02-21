"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { UserList } from "@/components/user-list"
import { UserDialog } from "@/components/user-dialog"

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEditUser = (userId: string) => {
    setEditingUser(userId)
    setShowUserDialog(true)
  }

  const handleCloseDialog = (open: boolean) => {
    setShowUserDialog(open)
    if (!open) {
      setEditingUser(null)
    }
  }

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Gestión de Usuarios</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Administra los usuarios del sistema</p>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Usuarios</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gestiona los accesos y roles de los usuarios</CardDescription>
            </div>
            <Button onClick={() => setShowUserDialog(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <UserList
            searchTerm={searchTerm}
            onEdit={handleEditUser}
            onRefresh={handleSuccess}
            refreshKey={refreshKey}
          />
        </CardContent>
      </Card>

      <UserDialog
        open={showUserDialog}
        onOpenChange={handleCloseDialog}
        userId={editingUser}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
