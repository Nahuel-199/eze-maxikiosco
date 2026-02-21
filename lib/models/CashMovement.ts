import mongoose, { Schema, Document, Model } from "mongoose"
import type { IUser } from "./User"
import type { ICashRegister } from "./CashRegister"

export type CashMovementType = "supplier_payment" | "expense" | "adjustment" | "withdrawal"

export interface ICashMovement extends Document {
  cash_register_id: mongoose.Types.ObjectId
  cashRegister?: ICashRegister
  type: CashMovementType
  amount: number
  description: string
  supplier_name?: string
  reference_number?: string
  created_by_name: string
  created_by_user_id?: mongoose.Types.ObjectId
  created_by_user?: IUser
  createdAt: Date
  updatedAt: Date
}

const CashMovementSchema = new Schema<ICashMovement>(
  {
    cash_register_id: {
      type: Schema.Types.ObjectId,
      ref: "CashRegister",
      required: [true, "La caja registradora es requerida"],
    },
    type: {
      type: String,
      enum: {
        values: ["supplier_payment", "expense", "adjustment", "withdrawal"],
        message: "{VALUE} no es un tipo de movimiento válido",
      },
      required: [true, "El tipo de movimiento es requerido"],
    },
    amount: {
      type: Number,
      required: [true, "El monto es requerido"],
      min: [0.01, "El monto debe ser mayor a 0"],
      get: (v: number) => Number(v.toFixed(2)),
      set: (v: number) => Number(v.toFixed(2)),
    },
    description: {
      type: String,
      required: [true, "La descripción es requerida"],
      trim: true,
      minlength: [3, "La descripción debe tener al menos 3 caracteres"],
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    supplier_name: {
      type: String,
      trim: true,
      maxlength: [200, "El nombre del proveedor no puede exceder 200 caracteres"],
    },
    reference_number: {
      type: String,
      trim: true,
      maxlength: [100, "El número de referencia no puede exceder 100 caracteres"],
    },
    created_by_name: {
      type: String,
      required: [true, "El nombre de quien registra es requerido"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    created_by_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
)

// Índices
CashMovementSchema.index({ cash_register_id: 1 })
CashMovementSchema.index({ type: 1 })
CashMovementSchema.index({ createdAt: -1 })
CashMovementSchema.index({ created_by_user_id: 1 })

// Validación: La caja debe estar abierta para registrar movimientos
CashMovementSchema.pre("save", async function () {
  if (!this.isNew) return

  const cashRegister = await mongoose.models.CashRegister.findById(
    this.cash_register_id
  )

  if (!cashRegister) {
    throw new Error("La caja registradora no existe")
  }

  if (cashRegister.status !== "open") {
    throw new Error(
      "No se puede registrar un movimiento en una caja que no está abierta"
    )
  }
})

// Validación: supplier_name requerido si el tipo es supplier_payment
CashMovementSchema.pre("save", function () {
  if (this.type === "supplier_payment" && !this.supplier_name) {
    throw new Error(
      "El nombre del proveedor es requerido para pagos a proveedores"
    )
  }
})

// Prevenir la recreación del modelo en hot reload
const CashMovement: Model<ICashMovement> =
  mongoose.models.CashMovement ||
  mongoose.model<ICashMovement>("CashMovement", CashMovementSchema)

export default CashMovement
