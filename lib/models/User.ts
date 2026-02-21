import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
  email: string
  password_hash: string
  full_name: string
  role: "admin" | "employee"
  active: boolean
  last_login?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "El email es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Por favor ingrese un email válido"],
    },
    password_hash: {
      type: String,
      required: [true, "La contraseña es requerida"],
    },
    full_name: {
      type: String,
      required: [true, "El nombre completo es requerido"],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "employee"],
        message: "{VALUE} no es un rol válido",
      },
      default: "employee",
    },
    active: {
      type: Boolean,
      default: true,
    },
    last_login: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Índices (email ya tiene índice por unique: true)
UserSchema.index({ role: 1 })
UserSchema.index({ active: 1 })

// Método para ocultar el password_hash al serializar
UserSchema.set("toJSON", {
  transform: function (_doc, ret) {
    delete ret.password_hash
    return ret
  },
})

// Prevenir la recreación del modelo en hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
