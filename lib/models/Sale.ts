import mongoose, { Schema, Document, Model } from "mongoose"
import type { IUser } from "./User"
import type { ICashRegister } from "./CashRegister"

export interface ISaleItem {
  product_id: mongoose.Types.ObjectId
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface IPaymentDetails {
  cash_amount: number
  card_amount: number
  transfer_amount: number
}

export interface ISale extends Document {
  cash_register_id: mongoose.Types.ObjectId
  cashRegister?: ICashRegister
  user_id: mongoose.Types.ObjectId
  user?: IUser
  total: number
  payment_method: "cash" | "card" | "transfer" | "mixed"
  payment_details?: IPaymentDetails
  items: ISaleItem[]
  createdAt: Date
  updatedAt: Date
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "El producto es requerido"],
    },
    product_name: {
      type: String,
      required: [true, "El nombre del producto es requerido"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "La cantidad es requerida"],
      min: [1, "La cantidad debe ser al menos 1"],
    },
    unit_price: {
      type: Number,
      required: [true, "El precio unitario es requerido"],
      min: [0, "El precio unitario no puede ser negativo"],
      get: (v: number) => Number(v.toFixed(2)),
      set: (v: number) => Number(v.toFixed(2)),
    },
    subtotal: {
      type: Number,
      required: [true, "El subtotal es requerido"],
      min: [0, "El subtotal no puede ser negativo"],
      get: (v: number) => Number(v.toFixed(2)),
      set: (v: number) => Number(v.toFixed(2)),
    },
  },
  { _id: true }
)

const SaleSchema = new Schema<ISale>(
  {
    cash_register_id: {
      type: Schema.Types.ObjectId,
      ref: "CashRegister",
      required: [true, "La caja registradora es requerida"],
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario es requerido"],
    },
    total: {
      type: Number,
      required: [true, "El total es requerido"],
      min: [0, "El total no puede ser negativo"],
      get: (v: number) => Number(v.toFixed(2)),
      set: (v: number) => Number(v.toFixed(2)),
    },
    payment_method: {
      type: String,
      enum: {
        values: ["cash", "card", "transfer", "mixed"],
        message: "{VALUE} no es un método de pago válido",
      },
      required: [true, "El método de pago es requerido"],
    },
    payment_details: {
      cash_amount: {
        type: Number,
        min: [0, "El monto en efectivo no puede ser negativo"],
        default: 0,
        get: (v: number) => Number((v || 0).toFixed(2)),
        set: (v: number) => Number((v || 0).toFixed(2)),
      },
      card_amount: {
        type: Number,
        min: [0, "El monto en tarjeta no puede ser negativo"],
        default: 0,
        get: (v: number) => Number((v || 0).toFixed(2)),
        set: (v: number) => Number((v || 0).toFixed(2)),
      },
      transfer_amount: {
        type: Number,
        min: [0, "El monto en transferencia no puede ser negativo"],
        default: 0,
        get: (v: number) => Number((v || 0).toFixed(2)),
        set: (v: number) => Number((v || 0).toFixed(2)),
      },
    },
    items: {
      type: [SaleItemSchema],
      required: [true, "Los items son requeridos"],
      validate: {
        validator: function (items: ISaleItem[]) {
          return items.length > 0
        },
        message: "La venta debe tener al menos un item",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
)

// Índices
SaleSchema.index({ cash_register_id: 1 })
SaleSchema.index({ user_id: 1 })
SaleSchema.index({ payment_method: 1 })
SaleSchema.index({ createdAt: -1 })
SaleSchema.index({ "items.product_id": 1 })

// Validar que el total sea correcto
SaleSchema.pre("save", function () {
  const calculatedTotal = this.items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  )
  const roundedTotal = Number(calculatedTotal.toFixed(2))

  if (Math.abs(this.total - roundedTotal) > 0.01) {
    throw new Error(
      `El total (${this.total}) no coincide con la suma de los items (${roundedTotal})`
    )
  }
})

// Validar que los subtotales sean correctos
SaleSchema.pre("save", function () {
  for (const item of this.items) {
    const calculatedSubtotal = Number(
      (item.quantity * item.unit_price).toFixed(2)
    )

    if (Math.abs(item.subtotal - calculatedSubtotal) > 0.01) {
      throw new Error(
        `El subtotal del item ${item.product_name} no coincide con cantidad * precio`
      )
    }
  }
})

// Validar payment_details para pagos mixtos
SaleSchema.pre("save", function () {
  if (this.payment_method === "mixed") {
    if (!this.payment_details) {
      throw new Error("Los pagos mixtos requieren el detalle de montos por método")
    }
    const detailTotal = Number(
      (
        (this.payment_details.cash_amount || 0) +
        (this.payment_details.card_amount || 0) +
        (this.payment_details.transfer_amount || 0)
      ).toFixed(2)
    )
    if (Math.abs(this.total - detailTotal) > 0.01) {
      throw new Error(
        `La suma de los montos del pago mixto ($${detailTotal}) no coincide con el total ($${this.total})`
      )
    }
  }
})

// Validar que la caja esté abierta antes de crear una venta
SaleSchema.pre("save", async function () {
  if (!this.isNew) return

  const cashRegister = await mongoose.models.CashRegister.findById(
    this.cash_register_id
  )

  if (!cashRegister) {
    throw new Error("La caja registradora no existe")
  }

  if (cashRegister.status !== "open") {
    throw new Error(
      "No se puede crear una venta en una caja que no está abierta"
    )
  }
})

// Prevenir la recreación del modelo en hot reload
// Usar deleteModel para limpiar modelo viejo si el schema cambió
let Sale: Model<ISale>
if (mongoose.models.Sale) {
  mongoose.deleteModel("Sale")
}
Sale = mongoose.model<ISale>("Sale", SaleSchema)

export default Sale
