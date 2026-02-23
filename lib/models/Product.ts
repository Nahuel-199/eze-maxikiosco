import mongoose, { Schema, Document, Model } from "mongoose"
import type { ICategory } from "./Category"

export interface IProduct extends Document {
  name: string
  description?: string
  sku?: string
  barcode?: string
  category_id?: mongoose.Types.ObjectId
  category?: ICategory
  price: number
  cost?: number
  stock: number
  min_stock: number
  image_url?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "El nombre del producto es requerido"],
      trim: true,
      maxlength: [200, "El nombre no puede exceder 200 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "La descripción no puede exceder 1000 caracteres"],
    },
    sku: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    price: {
      type: Number,
      required: [true, "El precio es requerido"],
      min: [0, "El precio no puede ser negativo"],
      get: (v: number) => Number(v.toFixed(2)),
      set: (v: number) => Number(v.toFixed(2)),
    },
    cost: {
      type: Number,
      min: [0, "El costo no puede ser negativo"],
      get: (v: number | undefined) => (v ? Number(v.toFixed(2)) : v),
      set: (v: number | undefined) => (v ? Number(v.toFixed(2)) : v),
    },
    stock: {
      type: Number,
      required: [true, "El stock es requerido"],
      min: [0, "El stock no puede ser negativo"],
      default: 0,
    },
    min_stock: {
      type: Number,
      required: [true, "El stock mínimo es requerido"],
      min: [0, "El stock mínimo no puede ser negativo"],
      default: 10,
    },
    image_url: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
)

// Índices (sku y barcode ya tienen índice por unique: true)
ProductSchema.index({ name: "text" })
ProductSchema.index({ category_id: 1 })
ProductSchema.index({ active: 1 })
ProductSchema.index({ stock: 1 })

// Virtual para verificar si el stock está bajo
ProductSchema.virtual("low_stock").get(function () {
  return this.stock <= this.min_stock
})

// Método para poblar la categoría
ProductSchema.methods.populateCategory = async function () {
  await this.populate("category_id")
  return this
}

// Prevenir la recreación del modelo en hot reload
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)

export default Product
