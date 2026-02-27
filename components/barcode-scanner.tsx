"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, X } from "lucide-react"

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (barcode: string) => void
}

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(false)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === 2) { // SCANNING
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch (err) {
        console.log("Error stopping scanner:", err)
      }
      scannerRef.current = null
    }
  }, [])

  const startScanner = useCallback(async () => {
    // Esperar a que el elemento exista en el DOM
    const element = document.getElementById("barcode-reader")
    if (!element) {
      console.error("Container not found")
      return
    }

    setStatus("starting")
    setError(null)

    // Limpiar escáner anterior si existe
    await stopScanner()

    try {
      const html5QrCode = new Html5Qrcode("barcode-reader")
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          if (mountedRef.current) {
            onScan(decodedText)
            stopScanner()
            onOpenChange(false)
          }
        },
        () => {
          // Callback de error de frame - ignorar
        }
      )

      if (mountedRef.current) {
        setStatus("scanning")
      }
    } catch (err) {
      console.error("Error al iniciar el escáner:", err)
      if (mountedRef.current) {
        setError(
          "No se pudo acceder a la cámara. Verificá los permisos del navegador."
        )
        setStatus("error")
      }
    }
  }, [onScan, onOpenChange, stopScanner])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [stopScanner])

  useEffect(() => {
    if (open) {
      // Dar tiempo al dialog para renderizar el contenedor
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          startScanner()
        }
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setStatus("idle")
      stopScanner()
    }
  }, [open, startScanner, stopScanner])

  const handleClose = () => {
    stopScanner()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear Código de Barras
          </DialogTitle>
          <DialogDescription>
            Apuntá la cámara al código de barras del producto
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {status === "error" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <X className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={startScanner}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div
                id="barcode-reader"
                className="w-full rounded-lg overflow-hidden bg-black"
                style={{ minHeight: "300px" }}
              />
              {(status === "idle" || status === "starting") && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
