"use client"

import { useEffect, useRef, useCallback } from "react"

interface UseBarcodeScanner {
  onScan: (barcode: string) => void
  enabled?: boolean
  minLength?: number
  maxDelay?: number
}

/**
 * Hook para detectar entrada de escáner de código de barras.
 *
 * Los escáneres de código de barras típicamente:
 * 1. Envían caracteres muy rápidamente (más rápido que un humano)
 * 2. Terminan con Enter (keyCode 13)
 *
 * @param onScan - Callback ejecutado cuando se detecta un código de barras completo
 * @param enabled - Si el escáner está habilitado (default: true)
 * @param minLength - Longitud mínima del código de barras (default: 3)
 * @param maxDelay - Tiempo máximo entre caracteres en ms (default: 50)
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 3,
  maxDelay = 50,
}: UseBarcodeScanner) {
  const bufferRef = useRef<string>("")
  const lastKeyTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetBuffer = useCallback(() => {
    bufferRef.current = ""
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignorar si está deshabilitado
      if (!enabled) return

      // Ignorar si el foco está en un input de texto (excepto búsqueda)
      const activeElement = document.activeElement
      const isInSearchInput = activeElement?.getAttribute("placeholder")?.toLowerCase().includes("buscar")

      if (
        activeElement &&
        (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") &&
        !isInSearchInput
      ) {
        return
      }

      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTimeRef.current

      // Si pasó mucho tiempo desde la última tecla, reiniciar buffer
      if (timeDiff > maxDelay && bufferRef.current.length > 0) {
        resetBuffer()
      }

      lastKeyTimeRef.current = currentTime

      // Enter finaliza la captura del código de barras
      if (event.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          // Es un código de barras válido
          event.preventDefault()
          event.stopPropagation()
          onScan(bufferRef.current)
        }
        resetBuffer()
        return
      }

      // Solo capturar caracteres alfanuméricos y algunos símbolos comunes en códigos de barras
      if (event.key.length === 1 && /^[a-zA-Z0-9\-_.]$/.test(event.key)) {
        bufferRef.current += event.key

        // Limpiar timeout anterior y establecer uno nuevo
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Si no se recibe más entrada en maxDelay*2 ms, limpiar el buffer
        timeoutRef.current = setTimeout(() => {
          resetBuffer()
        }, maxDelay * 2)
      }
    },
    [enabled, minLength, maxDelay, onScan, resetBuffer]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, handleKeyDown])

  return {
    resetBuffer,
  }
}
