import mongoose from "mongoose"
import bcrypt from "bcryptjs"

async function seedAdmin() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("MONGODB_URI no está configurada en .env")
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log("Conectado a MongoDB")

  // Importar modelo después de conectar
  const { default: User } = await import("../lib/models/User")

  const email = "gabrielnahuel96@gmail.com"

  const existing = await User.findOne({ email })
  if (existing) {
    console.log(`El usuario ${email} ya existe.`)
    await mongoose.disconnect()
    return
  }

  const password_hash = await bcrypt.hash("Lisboa1145", 12)

  await User.create({
    email,
    password_hash,
    full_name: "Nahue",
    role: "admin",
    active: true,
  })

  console.log(`Usuario admin creado: ${email}`)
  await mongoose.disconnect()
}

seedAdmin().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
