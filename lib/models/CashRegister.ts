import mongoose, { Schema, Document, Model } from "mongoose"
import type { IUser } from "./User"

export interface ICashRegister extends Document {
  operator_name: string
  opened_by_user_id?: mongoose.Types.ObjectId
  opened_by_user?: IUser
  closed_by_user_id?: mongoose.Types.ObjectId
  closed_by_user?: IUser
  user_id: mongoose.Types.ObjectId // Mantener por compatibilidad
  user?: IUser
  opening_amount: number
  closing_amount?: number
  expected_amount?: number
  difference?: number
  opened_at: Date
  closed_at?: Date
  status: "open" | "closed"
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const CashRegisterSchema = new Schema<ICashRegister>(
  {
    operator_name: {
      type: String,
      required: [true, "El nombre del operador es requerido"],
      trim: true,
      minlength: [2, "El nombre del operador debe tener al menos 2 caracteres"],
      maxlength: [100, "El nombre del operador no puede exceder 100 caracteres"],
    },
    opened_by_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    closed_by_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario es requerido"],
    },
    opening_amount: {
      type: Number,
      required: [true, "El monto de apertura es requerido"],
      min: [0, "El monto de apertura no puede ser negativo"],
      get: (v: number) => Number(v.toFixed(2)),
      set: (v: number) => Number(v.toFixed(2)),
    },
    closing_amount: {
      type: Number,
      min: [0, "El monto de cierre no puede ser negativo"],
      get: (v: number | undefined) => (v ? Number(v.toFixed(2)) : v),
      set: (v: number | undefined) => (v ? Number(v.toFixed(2)) : v),
    },
    expected_amount: {
      type: Number,
      min: [0, "El monto esperado no puede ser negativo"],
      get: (v: number | undefined) => (v ? Number(v.toFixed(2)) : v),
      set: (v: number | undefined) => (v ? Number(v.toFixed(2)) : v),
    },
    difference: {
      type: Number,
      get: (v: number | undefined) => (v ? Number(v.toFixed(2)) : v),
      set: (v: number | undefined) => (v ? Number(v.toFixed(2)) : v),
    },
    opened_at: {
      type: Date,
      required: [true, "La fecha de apertura es requerida"],
      default: Date.now,
    },
    closed_at: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ["open", "closed"],
        message: "{VALUE} no es un estado válido",
      },
      default: "open",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Las notas no pueden exceder 1000 caracteres"],
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
)

// Índices
CashRegisterSchema.index({ user_id: 1 })
CashRegisterSchema.index({ status: 1 })
CashRegisterSchema.index({ opened_at: -1 })
CashRegisterSchema.index({ closed_at: -1 })
CashRegisterSchema.index({ operator_name: 1 })
CashRegisterSchema.index({ opened_by_user_id: 1 })

// Validación: Solo puede haber UNA caja abierta en todo el sistema (caja global)
CashRegisterSchema.pre("save", async function () {
  if (this.isNew && this.status === "open") {
    const openRegister = await mongoose.models.CashRegister.findOne({
      status: "open",
    })

    if (openRegister) {
      throw new Error(
        "Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva."
      )
    }
  }
})

// Calcular la diferencia automáticamente al cerrar
CashRegisterSchema.pre("save", function () {
  if (
    this.status === "closed" &&
    this.closing_amount !== undefined &&
    this.expected_amount !== undefined
  ) {
    this.difference = Number(
      (this.closing_amount - this.expected_amount).toFixed(2)
    )
  }
})

// Prevenir la recreación del modelo en hot reload
const CashRegister: Model<ICashRegister> =
  mongoose.models.CashRegister ||
  mongoose.model<ICashRegister>("CashRegister", CashRegisterSchema)

export default CashRegister
