# MongoDB Models Documentation

Esta carpeta contiene todos los modelos de Mongoose para la aplicación Maxi-kiosco admin.

## Estructura de Modelos

### User (Usuario)
**Archivo:** `User.ts`

**Campos:**
- `email` (String, único, requerido): Email del usuario
- `password_hash` (String, requerido): Hash de la contraseña (bcrypt recomendado)
- `full_name` (String, requerido): Nombre completo del usuario
- `role` (Enum, requerido): "admin" o "employee"
- `active` (Boolean, default: true): Estado del usuario
- `last_login` (Date, opcional): Última fecha de login
- `createdAt`, `updatedAt` (Date, automático): Timestamps

**Índices:**
- `email`: Para login rápido
- `role`: Para filtros por rol
- `active`: Para consultas de usuarios activos

**Notas:**
- El password_hash se oculta automáticamente en JSON
- Se debe implementar hash de contraseñas antes de guardar

---

### Category (Categoría)
**Archivo:** `Category.ts`

**Campos:**
- `name` (String, único, requerido): Nombre de la categoría
- `description` (String, opcional): Descripción de la categoría
- `icon` (String, opcional): Emoji o ícono
- `active` (Boolean, default: true): Estado de la categoría
- `createdAt`, `updatedAt` (Date, automático): Timestamps

**Índices:**
- `name`: Para búsquedas y unicidad
- `active`: Para consultas de categorías activas

**Notas:**
- Los nombres son únicos (no puede haber categorías duplicadas)
- Se recomienda usar soft delete (active: false) en lugar de eliminar

---

### Product (Producto)
**Archivo:** `Product.ts`

**Campos:**
- `name` (String, requerido): Nombre del producto
- `description` (String, opcional): Descripción del producto
- `sku` (String, único, opcional): Código SKU
- `barcode` (String, único, opcional): Código de barras
- `category_id` (ObjectId, opcional): Referencia a Category
- `price` (Number, requerido): Precio de venta (≥ 0)
- `cost` (Number, opcional): Precio de costo (≥ 0)
- `stock` (Number, requerido): Stock actual (≥ 0)
- `min_stock` (Number, requerido): Stock mínimo (≥ 0)
- `image_url` (String, opcional): URL de la imagen
- `active` (Boolean, default: true): Estado del producto
- `createdAt`, `updatedAt` (Date, automático): Timestamps

**Índices:**
- `name`: Búsqueda por texto
- `sku`: Búsqueda por SKU
- `barcode`: Búsqueda por código de barras
- `category_id`: Filtros por categoría
- `active`: Productos activos
- `stock`: Para alertas de stock bajo

**Virtuales:**
- `low_stock` (Boolean): true si stock ≤ min_stock

**Métodos:**
- `populateCategory()`: Pobla la categoría asociada

**Notas:**
- Los precios se redondean automáticamente a 2 decimales
- SKU y barcode son únicos pero opcionales (índices sparse)
- Use `active: false` para ocultar productos sin eliminarlos

---

### CashRegister (Caja Registradora)
**Archivo:** `CashRegister.ts`

**Campos:**
- `user_id` (ObjectId, requerido): Referencia a User
- `opening_amount` (Number, requerido): Monto de apertura (≥ 0)
- `closing_amount` (Number, opcional): Monto de cierre (≥ 0)
- `expected_amount` (Number, opcional): Monto esperado (≥ 0)
- `difference` (Number, opcional): Diferencia (closing - expected)
- `opened_at` (Date, requerido): Fecha/hora de apertura
- `closed_at` (Date, opcional): Fecha/hora de cierre
- `status` (Enum, requerido): "open" o "closed"
- `notes` (String, opcional): Notas sobre la caja
- `createdAt`, `updatedAt` (Date, automático): Timestamps

**Índices:**
- `user_id`: Consultas por usuario
- `status`: Encontrar cajas abiertas
- `opened_at`: Historial ordenado por fecha
- `closed_at`: Historial de cierres

**Validaciones:**
- Solo puede haber una caja abierta por usuario
- La diferencia se calcula automáticamente al cerrar

**Flujo:**
1. Usuario abre caja con monto inicial
2. Se registran ventas contra la caja abierta
3. Al cerrar, se calcula expected_amount (opening + total de ventas)
4. Se ingresa closing_amount (conteo físico de efectivo)
5. Se calcula difference automáticamente

---

### Sale (Venta)
**Archivo:** `Sale.ts`

**Campos:**
- `cash_register_id` (ObjectId, requerido): Referencia a CashRegister
- `user_id` (ObjectId, requerido): Referencia a User
- `total` (Number, requerido): Total de la venta (≥ 0)
- `payment_method` (Enum, requerido): "cash", "card" o "transfer"
- `items` (Array, requerido): Items de la venta (SaleItem[])
- `createdAt`, `updatedAt` (Date, automático): Timestamps

**SaleItem (Embebido):**
- `product_id` (ObjectId, requerido): Referencia a Product
- `product_name` (String, requerido): Nombre del producto (desnormalizado)
- `quantity` (Number, requerido): Cantidad vendida (≥ 1)
- `unit_price` (Number, requerido): Precio unitario al momento de venta (≥ 0)
- `subtotal` (Number, requerido): Subtotal (quantity × unit_price)

**Índices:**
- `cash_register_id`: Ventas por caja
- `user_id`: Ventas por usuario
- `payment_method`: Reportes por método de pago
- `createdAt`: Reportes por fecha
- `items.product_id`: Análisis por producto

**Validaciones:**
- El total debe coincidir con la suma de subtotales
- Cada subtotal debe coincidir con quantity × unit_price
- La caja debe estar abierta al crear la venta
- Debe tener al menos un item

**Notas:**
- Los items están embebidos (no es una colección separada)
- `product_name` se desnormaliza para preservar el nombre histórico
- `unit_price` se guarda para preservar el precio al momento de venta
- Use transacciones para crear ventas y actualizar stock simultáneamente

---

## Uso de los Modelos

### Importación
```typescript
import { User, Category, Product, CashRegister, Sale } from "@/lib/models"
// O individualmente
import User from "@/lib/models/User"
```

### Conexión a la Base de Datos
```typescript
import { connectDB } from "@/lib/db"

export async function miServerAction() {
  await connectDB() // Siempre llamar antes de usar modelos

  // Operaciones de base de datos aquí
  const products = await Product.find({ active: true })

  return products
}
```

### Ejemplo: Crear un Usuario
```typescript
import bcrypt from "bcryptjs"
import { User } from "@/lib/models"

const passwordHash = await bcrypt.hash("password123", 10)

const newUser = await User.create({
  email: "empleado@kiosco.com",
  password_hash: passwordHash,
  full_name: "Juan Pérez",
  role: "employee",
  active: true,
})
```

### Ejemplo: Crear una Venta con Transacción
```typescript
import mongoose from "mongoose"
import { Sale, Product } from "@/lib/models"

const session = await mongoose.startSession()
session.startTransaction()

try {
  // Crear la venta
  const sale = await Sale.create([{
    cash_register_id: registerId,
    user_id: userId,
    total: 1500.50,
    payment_method: "cash",
    items: [
      {
        product_id: productId1,
        product_name: "Coca Cola 2L",
        quantity: 2,
        unit_price: 500.25,
        subtotal: 1000.50,
      },
      {
        product_id: productId2,
        product_name: "Papas Fritas",
        quantity: 1,
        unit_price: 500.00,
        subtotal: 500.00,
      }
    ]
  }], { session })

  // Actualizar stock de productos
  for (const item of sale[0].items) {
    await Product.findByIdAndUpdate(
      item.product_id,
      { $inc: { stock: -item.quantity } },
      { session }
    )
  }

  await session.commitTransaction()
  return sale[0]
} catch (error) {
  await session.abortTransaction()
  throw error
} finally {
  session.endSession()
}
```

### Ejemplo: Buscar Productos con Populate
```typescript
const products = await Product.find({ active: true })
  .populate("category_id", "name icon")
  .sort({ name: 1 })
  .limit(50)
```

### Ejemplo: Abrir Caja Registradora
```typescript
const cashRegister = await CashRegister.create({
  user_id: userId,
  opening_amount: 5000,
  opened_at: new Date(),
  status: "open",
})
// La validación automáticamente previene abrir múltiples cajas
```

---

## Consideraciones de Rendimiento

1. **Índices**: Todos los modelos tienen índices optimizados para consultas comunes
2. **Paginación**: Para listados grandes, usar `.limit()` y `.skip()`
3. **Proyección**: Seleccionar solo campos necesarios con `.select()`
4. **Populate**: Usar con moderación, puede ser costoso
5. **Text Search**: Product.name tiene índice de texto para búsquedas

## Migraciones y Seed Data

Para poblar la base de datos con datos iniciales, crear un script en `/scripts/seed.ts`:

```typescript
import { connectDB } from "@/lib/db"
import { Category, Product, User } from "@/lib/models"
import bcrypt from "bcryptjs"

async function seed() {
  await connectDB()

  // Crear categorías
  const bebidas = await Category.create({
    name: "Bebidas",
    description: "Gaseosas, jugos, aguas",
    icon: "🥤",
    active: true,
  })

  // Crear productos
  await Product.create({
    name: "Coca Cola 2L",
    category_id: bebidas._id,
    price: 500.25,
    cost: 350.00,
    stock: 50,
    min_stock: 10,
    active: true,
  })

  // Crear usuario admin
  const passwordHash = await bcrypt.hash("admin123", 10)
  await User.create({
    email: "admin@kiosco.com",
    password_hash: passwordHash,
    full_name: "Administrador",
    role: "admin",
    active: true,
  })

  console.log("✅ Base de datos poblada")
}

seed()
```
