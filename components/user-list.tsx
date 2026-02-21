"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, AlertCircle, Loader2, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, UserCircle } from "lucide-react"
import { getUsers, deleteUser } from "@/lib/actions/users"
import { toast } from "sonner"

interface UserListProps {
  searchTerm: string
  onEdit: (userId: string) => void
  onRefresh: () => void
  refreshKey?: number
}

interface User {
  id: string
  full_name: string
  email: string
  role: "admin" | "employee"
  active: boolean
  last_login: string | null
  created_at: string
}

const ITEMS_PER_PAGE = 20

export function UserList({ searchTerm, onEdit, onRefresh, refreshKey }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getUsers({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch,
        })

        setUsers(result.users || [])
        setTotalPages(result.totalPages)
        setTotalUsers(result.total)
      } catch (error) {
        console.error("Error al cargar usuarios:", error)
        setError("Error al cargar usuarios. Por favor intenta nuevamente.")
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [refreshKey, currentPage, debouncedSearch])

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    setDeleting(true)
    try {
      const result = await deleteUser(userToDelete.id)
      if (result.success) {
        toast.success("Usuario eliminado correctamente")
        onRefresh()
      } else {
        toast.error(result.error || "Error al eliminar el usuario")
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      toast.error("Error al eliminar el usuario")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca"
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge variant="default">Admin</Badge>
    }
    return <Badge variant="secondary">Empleado</Badge>
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => onRefresh()}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          {totalUsers > 0 ? (
            <>
              Mostrando {startIndex}-{endIndex} de {totalUsers} usuarios
            </>
          ) : (
            "No hay usuarios"
          )}
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {debouncedSearch
              ? "No se encontraron usuarios con ese criterio de búsqueda."
              : "No hay usuarios registrados."}
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="border rounded-lg p-3 sm:p-4 bg-card shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{user.full_name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex gap-1 -mr-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(user.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(user)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(user.role)}
                    <Badge variant={user.active ? "default" : "secondary"} className="text-xs">
                      {user.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Último acceso</p>
                  <p className="font-medium text-xs sm:text-sm">{formatDate(user.last_login)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs mb-0.5">Creado</p>
                  <p className="font-medium text-xs sm:text-sm">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block border rounded-md overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Último acceso</TableHead>
              <TableHead className="text-right w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {debouncedSearch
                    ? "No se encontraron usuarios con ese criterio de búsqueda."
                    : "No hay usuarios registrados."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "default" : "secondary"}>
                      {user.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {formatDate(user.last_login)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(user.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(user)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <div className="sm:hidden px-3 py-1 text-sm font-medium">
              {currentPage} / {totalPages}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar al usuario &quot;{userToDelete?.full_name}&quot;?
              Esta acción marcará al usuario como inactivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
