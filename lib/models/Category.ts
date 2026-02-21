import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICategory extends Document {
  name: string
  description?: string
  icon?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "El nombre de la categoría es requerido"],
      unique: true,
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    icon: {
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
  }
)

// Índices (name ya tiene índice por unique: true)
CategorySchema.index({ active: 1 })

// Prevenir la recreación del modelo en hot reload
const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema)

export default Category
