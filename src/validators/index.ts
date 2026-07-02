import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/* ───────────── Auth ───────────── */
export const adminLoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const customerRegisterSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const customerLoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

/* ───────────── Category ───────────── */
export const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Category name is too short').max(60),
  description: z.string().max(300).optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

/* ───────────── Product ───────────── */
const categorySlug = z
  .string()
  .min(1, 'Category is required')
  .max(80)
  .transform((s) => s.trim().toLowerCase());

export const productCreateSchema = z.object({
  name: z.string().min(2).max(160),
  shortDescription: z.string().min(2).max(300),
  longDescription: z.string().max(5000).optional().or(z.literal('')),
  images: z.array(z.string().min(1)).min(1, 'At least one image is required'),
  price: z.coerce.number().min(0),
  discountedPrice: z.coerce.number().min(0).nullable().optional(),
  category: categorySlug,
  brand: z.string().max(120).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  sku: z.string().max(60).optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().max(80).optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'featured']).default('newest'),
  featured: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  status: z.enum(['all', 'active', 'inactive']).optional(),
});

/* ───────────── Banner ───────────── */
const bannerPositions = [
  'home-top',
  'home-mid',
  'home-footer',
  'product-page',
  'category-page',
  'cart-page',
  'global-top',
] as const;

export const bannerCreateSchema = z.object({
  title: z.string().min(1).max(160),
  image: z.string().min(1, 'Banner image is required'),
  mobileImage: z.string().optional().or(z.literal('')),
  link: z.string().optional().or(z.literal('')),
  position: z.enum(bannerPositions),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
  startAt: z.coerce.date().nullable().optional(),
  endAt: z.coerce.date().nullable().optional(),
  durationHours: z.coerce.number().min(0).nullable().optional(),
});

export const bannerUpdateSchema = bannerCreateSchema.partial();

/* ───────────── Order ───────────── */
const orderItemInput = z.object({
  product: objectId,
  quantity: z.coerce.number().int().min(1).max(99),
  size: z.string().optional(),
  color: z.string().optional(),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemInput).min(1, 'Cart is empty'),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(7).max(20),
    email: z.string().email().optional().or(z.literal('')),
    line1: z.string().min(3),
    line2: z.string().optional().or(z.literal('')),
    city: z.string().min(2),
    state: z.string().optional().or(z.literal('')),
    pincode: z.string().min(4).max(12),
  }),
  paymentMethod: z.enum(['cod', 'prepaid']),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'in_progress',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
  ]),
  note: z.string().max(300).optional(),
});

export const paymentStatusUpdateSchema = z.object({
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded', 'failed']),
});

export const guestLookupSchema = z.object({
  orderNumber: z.string().min(3),
  phone: z.string().min(7),
});

/* ───────────── Payment settings ───────────── */
export const paymentToggleSchema = z.object({
  isEnabled: z.coerce.boolean(),
});

export const idParamSchema = z.object({ id: objectId });
