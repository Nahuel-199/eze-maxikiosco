"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadImage, deleteImage } from "@/lib/actions/cloudinary"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadImage(formData)

      if (result.success && result.url) {
        onChange(result.url)
      } else {
        setError(result.error || "Error al subir la imagen")
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      setError("Error al subir la imagen. Por favor intenta nuevamente.")
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    if (!value) return

    setUploading(true)
    setError(null)

    try {
      await deleteImage(value)
      onRemove()
    } catch (err) {
      console.error("Error removing image:", err)
      setError("Error al eliminar la imagen")
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {value ? (
        <div className="relative aspect-square w-full max-w-[200px] sm:max-w-[300px] overflow-hidden rounded-lg border border-border mx-auto sm:mx-0">
          <img
            src={value}
            alt="Product"
            className="h-full w-full object-cover"
          />
          <div className="absolute top-2 right-2 space-x-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="h-8 w-8"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            "flex aspect-square w-full max-w-[200px] sm:max-w-[300px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted mx-auto sm:mx-0",
            (disabled || uploading) && "cursor-not-allowed opacity-50",
            error && "border-destructive"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-3 sm:p-4">
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <div className="text-center px-2">
                <p className="text-xs sm:text-sm font-medium">Haz clic para subir</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  PNG, JPG, WEBP (máx. 5MB)
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" disabled className="text-xs">
                <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Seleccionar
              </Button>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        La imagen se optimizará automáticamente para web
      </p>
    </div>
  )
}
