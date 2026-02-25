import mongoose, { Schema, Document, Model } from "mongoose"

export interface IAuditLogChange {
  field: string
  from: any
  to: any
}

export type AuditAction = "create" | "update" | "delete" | "stock_update"
export type AuditEntityType = "product" | "category"

export interface IAuditLog extends Document {
  user_id: mongoose.Types.ObjectId
  user_name: string
  user_email: string
  action: AuditAction
  entity_type: AuditEntityType
  entity_name: string
  entity_id: mongoose.Types.ObjectId
  changes: IAuditLogChange[]
  createdAt: Date
}

const AuditLogChangeSchema = new Schema<IAuditLogChange>(
  {
    field: { type: String, required: true },
    from: { type: Schema.Types.Mixed },
    to: { type: Schema.Types.Mixed },
  },
  { _id: false }
)

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario es requerido"],
    },
    user_name: {
      type: String,
      required: [true, "El nombre del usuario es requerido"],
      trim: true,
    },
    user_email: {
      type: String,
      required: [true, "El email del usuario es requerido"],
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      enum: {
        values: ["create", "update", "delete", "stock_update"],
        message: "{VALUE} no es una acción válida",
      },
      required: [true, "La acción es requerida"],
    },
    entity_type: {
      type: String,
      enum: {
        values: ["product", "category"],
        message: "{VALUE} no es un tipo de entidad válido",
      },
      required: [true, "El tipo de entidad es requerido"],
    },
    entity_name: {
      type: String,
      required: [true, "El nombre de la entidad es requerido"],
      trim: true,
    },
    entity_id: {
      type: Schema.Types.ObjectId,
      required: [true, "El ID de la entidad es requerido"],
    },
    changes: {
      type: [AuditLogChangeSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

AuditLogSchema.index({ user_id: 1 })
AuditLogSchema.index({ action: 1 })
AuditLogSchema.index({ entity_type: 1 })
AuditLogSchema.index({ createdAt: -1 })

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)

export default AuditLog
