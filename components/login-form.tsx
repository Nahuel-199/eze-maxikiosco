"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, checkEmail, setupPassword } from "@/lib/auth"
import { Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react"

type Step = "email" | "password" | "setup-password"

export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState("")

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await checkEmail(email)

      if (!result.exists) {
        setError("No se encontró una cuenta con ese email")
        return
      }

      if (result.mustChangePassword) {
        setFullName(result.fullName || "")
        setStep("setup-password")
      } else {
        setFullName(result.fullName || "")
        setStep("password")
      }
    } catch {
      setError("Error al verificar el email")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch {
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      const result = await setupPassword(email, newPassword)
      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(result.error || "Error al crear la contraseña")
      }
    } catch {
      setError("Error al crear la contraseña")
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setStep("email")
    setPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setShowPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <Card className="w-full max-w-md shadow-xl mx-4 sm:mx-0">
      <CardHeader className="space-y-2 text-center px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex justify-center mb-2">
          <img
            src="/logo360.png"
            alt="Controla360 Logo"
            width={64}
            height={64}
            className="rounded-lg"
          />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">Controla360</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {step === "email" && "Ingresá tu email para acceder al sistema"}
          {step === "password" && (
            <>
              Hola, <span className="font-medium text-foreground">{fullName}</span>
            </>
          )}
          {step === "setup-password" && (
            <>
              Bienvenido/a, <span className="font-medium text-foreground">{fullName}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
        {/* PASO 1: Email */}
        {step === "email" && (
          <form onSubmit={handleCheckEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Verificando..." : "Continuar"}
            </Button>
          </form>
        )}

        {/* PASO 2a: Contraseña (usuario existente) */}
        {step === "password" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={goBack}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </form>
        )}

        {/* PASO 2b: Crear contraseña (primer inicio) */}
        {step === "setup-password" && (
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <KeyRound className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Es tu primer inicio de sesión. Creá tu contraseña para continuar.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm sm:text-base">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm sm:text-base">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repetí la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creando contraseña..." : "Crear Contraseña e Ingresar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={goBack}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
