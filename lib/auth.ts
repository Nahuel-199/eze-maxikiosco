"use server"

import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"

export async function login(email: string, password: string) {
  await connectDB()

  const user = await User.findOne({ email: email.toLowerCase(), active: true })

  if (!user) {
    return { success: false, error: "Credenciales inválidas" }
  }

  const isValid = await bcrypt.compare(password, user.password_hash)

  if (!isValid) {
    return { success: false, error: "Credenciales inválidas" }
  }

  // Actualizar último login
  user.last_login = new Date()
  await user.save()

  const session = {
    id: user._id.toString(),
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    permissions: user.permissions ?? [],
  }

  const cookieStore = await cookies()
  cookieStore.set("session", JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return { success: true, user: session }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

/**
 * Requiere sesión autenticada. Retorna la sesión o un objeto de error.
 */
export async function requireSession(): Promise<
  | { session: { id: string; email: string; full_name: string; role: string; permissions?: string[] }; error?: never }
  | { session?: never; error: string }
> {
  const session = await getSession()
  if (!session) {
    return { error: "No autenticado" }
  }
  return { session }
}

/**
 * Requiere sesión con un permiso específico. Los admins siempre pasan.
 */
export async function requirePermission(permission: string): Promise<
  | { session: { id: string; email: string; full_name: string; role: string; permissions?: string[] }; error?: never }
  | { session?: never; error: string }
> {
  const result = await requireSession()
  if (result.error) return result
  const { session } = result
  if (session.role === "admin") return { session }
  if (session.permissions?.includes(permission)) return { session }
  return { error: "No tenés permiso para realizar esta acción" }
}

/**
 * Requiere que el usuario sea admin.
 */
export async function requireAdmin(): Promise<
  | { session: { id: string; email: string; full_name: string; role: string; permissions?: string[] }; error?: never }
  | { session?: never; error: string }
> {
  const result = await requireSession()
  if (result.error) return result
  if (result.session.role !== "admin") {
    return { error: "Se requiere rol de administrador" }
  }
  return { session: result.session }
}
