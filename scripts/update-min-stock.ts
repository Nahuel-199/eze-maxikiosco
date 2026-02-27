import { readFileSync } from "fs"
import { resolve } from "path"
import mongoose from "mongoose"

const envPath = resolve(process.cwd(), ".env")
const envContent = readFileSync(envPath, "utf-8")
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("MONGODB_URI no esta definida en .env")
  process.exit(1)
}

async function main() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Conectado a MongoDB")
    console.log("DB:", mongoose.connection.name)

    const db = mongoose.connection.db!
    const collection = db.collection("products")

    const total = await collection.countDocuments()
    console.log(`Total productos: ${total}`)

    // Buscar productos donde min_stock != 10 (incluye 0, null, undefined)
    const toUpdate = await collection.countDocuments({
      $or: [
        { min_stock: { $ne: 10 } },
        { min_stock: { $exists: false } },
        { min_stock: null },
      ],
    })
    console.log(`Productos con min_stock != 10: ${toUpdate}`)

    if (toUpdate === 0) {
      console.log("No hay productos que actualizar")
    } else {
      const result = await collection.updateMany(
        {
          $or: [
            { min_stock: { $ne: 10 } },
            { min_stock: { $exists: false } },
            { min_stock: null },
          ],
        },
        { $set: { min_stock: 10 } }
      )
      console.log(`${result.modifiedCount} productos actualizados (min_stock -> 10)`)
    }

    // Verificar resultado
    const after = await collection.find({}, { projection: { name: 1, min_stock: 1 } }).toArray()
    console.log("\nEstado final:")
    for (const p of after) {
      console.log(`  - ${p.name}: min_stock = ${p.min_stock}`)
    }
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log("\nDesconectado de MongoDB")
  }
}

main()
