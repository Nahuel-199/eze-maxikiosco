# Server Actions Documentation

Esta carpeta contiene los Server Actions de Next.js para operaciones del lado del servidor.

## Cloudinary Actions

**Archivo:** `cloudinary.ts`

Server Actions para gestión de imágenes con Cloudinary.

### `uploadImage(formData: FormData)`

Sube una imagen a Cloudinary.

**Parámetros:**
- `formData`: FormData conteniendo el archivo en el campo `'file'`

**Retorna:**
```typescript
{
  success: boolean
  url?: string      // URL de la imagen subida
  error?: string    // Mensaje de error si falla
}
```

**Validaciones:**
- El archivo debe ser una imagen (MIME type image/*)
- Tamaño máximo: 5MB
- Formatos soportados: PNG, JPG, WEBP, GIF, etc.

**Transformaciones Automáticas:**
- Redimensionamiento: máximo 800x800px (mantiene proporciones)
- Calidad: automática (optimizada por Cloudinary)
- Formato: automático (WebP en navegadores compatibles)
- Carpeta: `maxi-kiosco/products`

**Ejemplo de uso:**
```typescript
"use server"

import { uploadImage } from "@/lib/actions/cloudinary"

export async function handleImageUpload(formData: FormData) {
  const result = await uploadImage(formData)

  if (result.success) {
    console.log("Imagen subida:", result.url)
    // Guardar result.url en la base de datos
  } else {
    console.error("Error:", result.error)
  }

  return result
}
```

**Desde el cliente:**
```typescript
"use client"

import { uploadImage } from "@/lib/actions/cloudinary"

async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append("file", file)

  const result = await uploadImage(formData)

  if (result.success) {
    // Hacer algo con result.url
  }
}
```

---

### `deleteImage(imageUrl: string)`

Elimina una imagen de Cloudinary.

**Parámetros:**
- `imageUrl`: URL completa de la imagen en Cloudinary

**Retorna:**
```typescript
{
  success: boolean
  error?: string    // Mensaje de error si falla
}
```

**Ejemplo de uso:**
```typescript
import { deleteImage } from "@/lib/actions/cloudinary"

async function removeProductImage(imageUrl: string) {
  const result = await deleteImage(imageUrl)

  if (result.success) {
    console.log("Imagen eliminada correctamente")
  } else {
    console.error("Error al eliminar:", result.error)
  }
}
```

**Notas:**
- Extrae automáticamente el `public_id` de la URL
- Si la imagen no existe, no genera error
- Es seguro llamarlo múltiples veces con la misma URL

---

### `getOptimizedImageUrl(publicId: string, options?)`

Genera una URL optimizada para una imagen ya subida a Cloudinary.

**Parámetros:**
- `publicId`: Public ID de la imagen en Cloudinary
- `options`: Objeto con opciones de transformación
  - `width` (number): Ancho deseado (default: 400)
  - `height` (number): Alto deseado (default: 400)
  - `crop` (string): Modo de recorte (default: "fill")
  - `quality` (string | number): Calidad de la imagen (default: "auto")

**Retorna:**
- `string`: URL optimizada de la imagen

**Ejemplo de uso:**
```typescript
import { getOptimizedImageUrl } from "@/lib/actions/cloudinary"

// Thumbnail pequeño
const thumbnailUrl = getOptimizedImageUrl("maxi-kiosco/products/abc123", {
  width: 150,
  height: 150,
  crop: "thumb",
  quality: 80
})

// Imagen para galería
const galleryUrl = getOptimizedImageUrl("maxi-kiosco/products/abc123", {
  width: 1200,
  height: 800,
  crop: "fill",
  quality: "auto"
})
```

---

## Flujo Completo de Gestión de Imágenes

### 1. Subir Imagen al Crear Producto

```typescript
"use server"

import { connectDB } from "@/lib/db"
import { Product } from "@/lib/models"
import { uploadImage } from "@/lib/actions/cloudinary"

export async function createProduct(formData: FormData) {
  // Subir imagen
  const imageFile = formData.get("image") as File
  let imageUrl = ""

  if (imageFile && imageFile.size > 0) {
    const imageFormData = new FormData()
    imageFormData.append("file", imageFile)

    const uploadResult = await uploadImage(imageFormData)
    if (uploadResult.success && uploadResult.url) {
      imageUrl = uploadResult.url
    }
  }

  // Crear producto
  await connectDB()
  const product = await Product.create({
    name: formData.get("name"),
    price: Number(formData.get("price")),
    image_url: imageUrl,
    // ... otros campos
  })

  return product
}
```

### 2. Actualizar Imagen de Producto

```typescript
"use server"

import { connectDB } from "@/lib/db"
import { Product } from "@/lib/models"
import { uploadImage, deleteImage } from "@/lib/actions/cloudinary"

export async function updateProductImage(
  productId: string,
  formData: FormData
) {
  await connectDB()

  // Obtener producto actual
  const product = await Product.findById(productId)
  if (!product) throw new Error("Producto no encontrado")

  // Eliminar imagen anterior si existe
  if (product.image_url) {
    await deleteImage(product.image_url)
  }

  // Subir nueva imagen
  const uploadResult = await uploadImage(formData)
  if (!uploadResult.success) {
    throw new Error(uploadResult.error || "Error al subir imagen")
  }

  // Actualizar producto
  product.image_url = uploadResult.url
  await product.save()

  return product
}
```

### 3. Eliminar Producto con su Imagen

```typescript
"use server"

import { connectDB } from "@/lib/db"
import { Product } from "@/lib/models"
import { deleteImage } from "@/lib/actions/cloudinary"

export async function deleteProduct(productId: string) {
  await connectDB()

  const product = await Product.findById(productId)
  if (!product) throw new Error("Producto no encontrado")

  // Eliminar imagen de Cloudinary
  if (product.image_url) {
    await deleteImage(product.image_url)
  }

  // Soft delete o eliminación física
  await product.deleteOne()

  return { success: true }
}
```

---

## Configuración de Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Obtener credenciales:**
1. Ingresa a [console.cloudinary.com](https://console.cloudinary.com/)
2. En el Dashboard verás:
   - Cloud Name
   - API Key
   - API Secret
3. Copia estos valores a tu archivo `.env`

---

## Mejores Prácticas

### 1. Siempre Eliminar Imágenes Antiguas
Cuando actualizas o eliminas un producto, elimina también su imagen de Cloudinary para no acumular archivos innecesarios.

### 2. Manejo de Errores
Siempre verifica el resultado de las operaciones:

```typescript
const result = await uploadImage(formData)
if (!result.success) {
  // Manejar error
  console.error(result.error)
  return { error: result.error }
}
```

### 3. Validación en el Cliente
Valida archivos antes de enviarlos al servidor:

```typescript
function validateImage(file: File) {
  // Tamaño máximo 5MB
  if (file.size > 5 * 1024 * 1024) {
    return "La imagen no puede superar los 5MB"
  }

  // Solo imágenes
  if (!file.type.startsWith("image/")) {
    return "El archivo debe ser una imagen"
  }

  return null
}
```

### 4. Loading States
Muestra indicadores de carga durante las operaciones:

```typescript
const [uploading, setUploading] = useState(false)

async function handleUpload(file: File) {
  setUploading(true)
  try {
    const formData = new FormData()
    formData.append("file", file)
    const result = await uploadImage(formData)
    // ...
  } finally {
    setUploading(false)
  }
}
```

### 5. Optimización de Imágenes
Usa `getOptimizedImageUrl` para generar diferentes tamaños según el contexto:

```typescript
// Lista de productos (thumbnail)
<img src={getOptimizedImageUrl(publicId, { width: 150, height: 150 })} />

// Detalle de producto (grande)
<img src={getOptimizedImageUrl(publicId, { width: 800, height: 800 })} />
```

---

## Troubleshooting

### Error: "No se proporcionó ningún archivo"
- Verifica que el campo del FormData se llame `"file"`
- Asegúrate de que el archivo existe: `if (file && file.size > 0)`

### Error: "Invalid cloud_name"
- Verifica que `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` esté correctamente configurado
- El nombre debe ser exactamente como aparece en tu dashboard de Cloudinary

### Error: "Invalid API key"
- Verifica las variables `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`
- Asegúrate de no tener espacios extra en las variables de entorno

### Imágenes no se muestran
- Verifica que la URL esté guardada correctamente en la base de datos
- Comprueba que la imagen existe en Cloudinary (revisa el Media Library)
- Verifica CORS si estás en desarrollo local
