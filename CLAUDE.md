# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Maxi-kiosco admin** system - a point-of-sale (POS) and inventory management application for a kiosk/convenience store. The project is built with Next.js 16 and uses React 19, automatically synced with v0.app deployments.

**Technology Stack:**
- Next.js 16.1.1 (App Router)
- React 19.2.3
- TypeScript 5.9.3
- Tailwind CSS 4.1.9
- shadcn/ui components (new-york style)
- MongoDB with Mongoose ODM
- Cloudinary for image storage and optimization
- pnpm for package management

**Database:**
- MongoDB for persistent data storage
- Mongoose 9.1.3 for schema definition and validation
- Connection utility with caching (`lib/db.ts`)
- Models defined in `lib/models/` directory

**Image Management:**
- Cloudinary for product image uploads and storage
- Automatic image optimization (resizing, compression, format conversion)
- Server Actions for secure upload/delete operations (`lib/actions/cloudinary.ts`)
- Reusable ImageUpload component (`components/image-upload.tsx`)
- Images stored in `maxi-kiosco/products` folder
- Maximum file size: 5MB
- Supported formats: PNG, JPG, WEBP

**Deployment:**
- Hosted on Vercel
- Live at: https://vercel.com/nahuel199s-projects/v0-maxi-kiosco-admin
- Changes are automatically synced from v0.app

## Common Commands

```bash
# Development
pnpm dev              # Start development server (default: http://localhost:3000)

# Build
pnpm build           # Build for production

# Production
pnpm start           # Start production server

# Linting
pnpm lint            # Run ESLint

# Package Management
pnpm install         # Install dependencies
```

## Project Structure

```
/app                  # Next.js App Router pages
  /dashboard         # Main dashboard and protected routes
    /pos             # Point of Sale system
    /products        # Product management
    /cash-register   # Cash register operations
    /reports         # Sales reports and analytics
  /login             # Authentication page
  layout.tsx         # Root layout with Analytics
  globals.css        # Global styles and Tailwind configuration

/components          # React components
  /ui                # shadcn/ui base components
  [feature]-*.tsx    # Feature-specific components

/lib                 # Utilities and shared code
  /models            # MongoDB models (Mongoose schemas)
    User.ts          # User model with authentication
    Category.ts      # Product category model
    Product.ts       # Product/inventory model
    CashRegister.ts  # Cash register session model
    Sale.ts          # Sales transaction model with embedded items
    index.ts         # Export all models
  types.ts           # TypeScript type definitions (client-side)
  auth.ts            # Authentication logic (server actions)
  mock-data.ts       # Mock data for development
  utils.ts           # Utility functions
  db.ts              # MongoDB connection utility

/public              # Static assets
/styles              # Additional stylesheets
proxy.ts             # Middleware for route protection
```

## Architecture

### Authentication & Authorization

- **Server-side authentication** using Next.js Server Actions (`lib/auth.ts`)
- Session management with HTTP-only cookies
- Mock authentication currently in place (ready for database integration)
  - Default credentials: `admin@kiosco.com` / `admin123`
- Middleware (`proxy.ts`) protects all routes except `/login`
- Two user roles: `admin` and `employee`

### Database & Data Model

**MongoDB Connection:**
- Connection managed by `lib/db.ts` with caching to prevent connection exhaustion
- Environment variable `MONGODB_URI` required (see `.env.example`)
- Connection is lazy-loaded (only connects when first database operation occurs)

**Mongoose Models** (located in `lib/models/`):

1. **User** (`User.ts`):
   - Authentication and role management (admin/employee)
   - Password hashing required before saving
   - Indexes: email, role, active
   - Automatic timestamps (createdAt, updatedAt)

2. **Category** (`Category.ts`):
   - Product categorization with emoji icons
   - Unique name constraint
   - Soft delete via `active` field
   - Indexes: name, active

3. **Product** (`Product.ts`):
   - Inventory management with SKU/barcode support
   - Reference to Category (category_id)
   - Price tracking (selling price + cost)
   - Stock levels with minimum thresholds
   - Virtual field `low_stock` for alerts
   - Indexes: name (text search), sku, barcode, category_id, stock

4. **CashRegister** (`CashRegister.ts`):
   - Cash register session tracking
   - Reference to User (user_id)
   - Opening/closing amounts with automatic difference calculation
   - Status: "open" | "closed"
   - Pre-save validation: only one open register per user
   - Indexes: user_id, status, opened_at, closed_at

5. **Sale** (`Sale.ts`):
   - Transaction records with payment methods (cash/card/transfer)
   - References to CashRegister and User
   - Embedded SaleItems array (denormalized product data)
   - Pre-save validations:
     - Total must match sum of items
     - Subtotals must match quantity × price
     - Cash register must be open
   - Indexes: cash_register_id, user_id, payment_method, createdAt

6. **SaleItem** (embedded in Sale):
   - Product reference with denormalized product_name (for history)
   - Quantity, unit_price, subtotal
   - Preserves price at time of sale

7. **CartItem** (client-side only, not in database):
   - Temporary shopping cart state in POS system

**Type Definitions:**
- Client-side types in `lib/types.ts` (compatible with MongoDB models)
- Model interfaces exported from each model file (IUser, ICategory, etc.)
- Import models from `lib/models` for database operations

### Component Architecture

**Client vs Server Components:**
- Most UI components are **client components** (`"use client"`) for interactivity
- Dashboard pages are **server components** for session checking
- Authentication functions use `"use server"` directive

**State Management:**
- Local component state with `useState` for UI state
- No global state management library (Redux, Zustand, etc.)
- Mock data imported from `lib/mock-data.ts` for development

**Key Feature Components:**
- `pos-system.tsx`: POS interface with cart, product selection, search
- `product-management.tsx`: CRUD operations for products
- `cash-register-control.tsx`: Open/close cash register operations
- `sales-reports.tsx`: Analytics and reporting
- `dashboard-nav.tsx`: Navigation with logout functionality

### Styling

- **Tailwind CSS 4** with CSS variables for theming
- **shadcn/ui** component library (new-york style, neutral base color)
- Path aliases configured: `@/*` maps to project root
- CSS variables for colors defined in `globals.css`
- Icons from `lucide-react`

## Development Notes

### Path Aliases

All imports use `@/` prefix:
```typescript
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth"
import type { Product } from "@/lib/types"
```

### TypeScript Configuration

- `ignoreBuildErrors: true` in `next.config.mjs` (for rapid prototyping)
- `jsx: "react-jsx"` mode
- Strict mode enabled
- Module resolution: `bundler`

### Image Optimization

Images are unoptimized (`unoptimized: true` in next.config.mjs) for simplicity.

### Database Usage

**Setup:**
1. Copy `.env.example` to `.env`
2. Set `MONGODB_URI` to your MongoDB connection string
3. Run the application - database connection is automatic

**Using Models in Server Components/Actions:**
```typescript
import { connectDB } from "@/lib/db"
import { Product, Category } from "@/lib/models"

export async function getProducts() {
  await connectDB()
  const products = await Product.find({ active: true })
    .populate("category_id")
    .sort({ name: 1 })
  return products
}
```

**Important Notes:**
- Always call `await connectDB()` before any database operation
- Models handle validation automatically (see each model file)
- Use transactions for operations that modify multiple collections
- Client components cannot directly access database - use Server Actions

**Mock Data:**
- Mock data still exists in `lib/mock-data.ts` for development/testing
- Components currently use mock data - ready to be replaced with database queries
- To migrate a feature: create Server Actions that use models, then replace mock imports

### Cloudinary Image Management

**Setup:**
1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from the [Cloudinary Console](https://console.cloudinary.com/)
3. Add credentials to `.env`:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

**Using the ImageUpload Component:**
```typescript
import { ImageUpload } from "@/components/image-upload"
import { useState } from "react"

function ProductForm() {
  const [imageUrl, setImageUrl] = useState<string>("")

  return (
    <ImageUpload
      value={imageUrl}
      onChange={(url) => setImageUrl(url)}
      onRemove={() => setImageUrl("")}
      disabled={false}
    />
  )
}
```

**Server Actions Available:**
- `uploadImage(formData)`: Uploads an image and returns the URL
- `deleteImage(imageUrl)`: Deletes an image from Cloudinary
- `getOptimizedImageUrl(publicId, options)`: Gets optimized image URL

**Image Specifications:**
- Maximum file size: 5MB
- Supported formats: PNG, JPG, WEBP
- Auto-optimization: Images are automatically resized to 800x800px max, compressed, and converted to optimal format
- Storage folder: `maxi-kiosco/products`

**Important Notes:**
- Images are uploaded directly to Cloudinary (not to your server)
- URLs are stored in the Product model's `image_url` field
- Old images should be deleted when updating/removing products
- All uploads go through Server Actions for security

### Form Handling

- Uses `react-hook-form` with `@hookform/resolvers`
- Zod for schema validation
- Forms typically wrapped in Dialog components from shadcn/ui

### Cash Register Flow

1. User opens register with starting amount
2. POS system becomes available for sales
3. Sales are recorded against the open register
4. User closes register with counted cash (tracks differences)

## Adding New Features

When adding new features to this codebase:

1. **New pages**: Create in `/app/dashboard/[feature]` directory
2. **New components**: Add to `/components` (use `/components/ui` for base UI)
3. **New types**: Add to `lib/types.ts`
4. **New utilities**: Add to `lib/utils.ts`
5. Follow the existing pattern of server/client component separation
6. Use existing shadcn/ui components before creating custom ones

## MongoDB Best Practices

### Transactions for Critical Operations

Use MongoDB transactions for operations that need atomicity:

```typescript
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import { Product, Sale } from "@/lib/models"

export async function createSale(saleData, items) {
  await connectDB()

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Create sale
    const sale = await Sale.create([saleData], { session })

    // Update product stock for each item
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { stock: -item.quantity } },
        { session }
      )
    }

    await session.commitTransaction()
    return sale[0]
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}
```

### Data Validation

Models include extensive validation:
- Required fields
- Numeric ranges (prices, stock must be ≥ 0)
- Enum values (payment methods, roles, status)
- Unique constraints (email, SKU, barcode)
- Custom validators (only one open register per user)

### Indexes

All models have appropriate indexes for common queries:
- Product: text search on name, lookups by SKU/barcode
- Sale: queries by date range, payment method, cash register
- CashRegister: finding open registers, history by user

### Denormalization

- `product_name` is denormalized in SaleItems to preserve historical data
- Categories can be populated on Product queries when needed
- Balance between normalization and query performance

## Spanish Language

The application UI is in **Spanish** (Argentina/regional). Maintain this language for all user-facing text:
- Button labels, form fields, error messages
- Navigation items
- Reports and data labels
- Database validation error messages (already in Spanish in models)
