"use server"

import cloudinary from "@/lib/cloudinary"
import { requirePermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

/**
 * Sube una imagen a Cloudinary
 * @param formData - FormData conteniendo el archivo en el campo 'file'
 * @returns URL de la imagen subida o null si hay error
 */
export async function uploadImage(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const auth = await requirePermission(PERMISSIONS.PRODUCTS_EDIT)
    if (auth.error) return { success: false, error: auth.error }

    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No se proporcionó ningún archivo" }
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "El archivo debe ser una imagen" }
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "La imagen no puede superar los 5MB",
      }
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir a Cloudinary usando upload_stream
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `${process.env.CLOUDINARY_FOLDER || "controla360"}/products`,
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error)
            else if (result) resolve(result)
            else reject(new Error("No se recibió resultado de Cloudinary"))
          }
        )

        uploadStream.end(buffer)
      }
    )

    return {
      success: true,
      url: result.secure_url,
    }
  } catch (error) {
    console.error("Error al subir imagen a Cloudinary:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al subir la imagen",
    }
  }
}

/**
 * Elimina una imagen de Cloudinary usando su URL
 * @param imageUrl - URL completa de la imagen en Cloudinary
 * @returns true si se eliminó correctamente, false en caso contrario
 */
export async function deleteImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requirePermission(PERMISSIONS.PRODUCTS_EDIT)
    if (auth.error) return { success: false, error: auth.error }

    if (!imageUrl) {
      return { success: false, error: "No se proporcionó URL de imagen" }
    }

    // Extraer el public_id de la URL de Cloudinary
    // URL formato: https://res.cloudinary.com/cloud/image/upload/v123/folder/products/filename.ext
    const uploadIndex = imageUrl.indexOf("/upload/")
    if (uploadIndex === -1) {
      return { success: false, error: "URL de imagen no válida" }
    }
    const afterUpload = imageUrl.substring(uploadIndex + 8) // después de "/upload/"
    // Remover versión (v123456/) si existe
    const withoutVersion = afterUpload.replace(/^v\d+\//, "")
    // Remover extensión del archivo
    const publicId = withoutVersion.replace(/\.[^/.]+$/, "")

    await cloudinary.uploader.destroy(publicId)

    return { success: true }
  } catch (error) {
    console.error("Error al eliminar imagen de Cloudinary:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al eliminar la imagen",
    }
  }
}

/**
 * Obtiene la URL optimizada de una imagen de Cloudinary
 * @param publicId - Public ID de la imagen en Cloudinary
 * @param options - Opciones de transformación
 * @returns URL optimizada de la imagen
 */
export async function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    crop?: string
    quality?: string | number
  }
): Promise<string> {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options?.width || 400,
        height: options?.height || 400,
        crop: options?.crop || "fill",
      },
      { quality: options?.quality || "auto" },
      { fetch_format: "auto" },
    ],
  })
}
