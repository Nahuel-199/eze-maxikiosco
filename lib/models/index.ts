// Exportar todos los modelos desde un solo archivo
export { default as User } from "./User"
export { default as Category } from "./Category"
export { default as Product } from "./Product"
export { default as CashRegister } from "./CashRegister"
export { default as CashMovement } from "./CashMovement"
export { default as Sale } from "./Sale"

// Exportar tipos
export type { IUser } from "./User"
export type { ICategory } from "./Category"
export type { IProduct } from "./Product"
export type { ICashRegister } from "./CashRegister"
export type { ICashMovement, CashMovementType } from "./CashMovement"
export type { ISale, ISaleItem } from "./Sale"
