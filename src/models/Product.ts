import { Schema, model, HydratedDocument } from 'mongoose';
import slugify from 'slugify';

// Categories are dynamic (see Category model). A product stores the category slug.
export type ProductCategory = string;

export interface IProduct {
  name: string;
  slug: string;
  shortDescription: string;
  longDescription?: string;
  images: string[];
  price: number;
  discountedPrice?: number | null;
  category: ProductCategory;
  brand: string;
  sizes: string[];
  colors: string[];
  stock: number;
  sku?: string;
  isActive: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    longDescription: { type: String, trim: true },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one product image is required',
      },
    },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        validator(this: IProduct, v: number | null) {
          return v == null || v < this.price;
        },
        message: 'Discounted price must be lower than the original price',
      },
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    brand: { type: String, default: 'Sanwariya Brand House', trim: true },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Virtuals: effective price + discount %
productSchema.virtual('effectivePrice').get(function (this: IProduct) {
  return this.discountedPrice != null && this.discountedPrice < this.price
    ? this.discountedPrice
    : this.price;
});

productSchema.virtual('discountPercent').get(function (this: IProduct) {
  if (this.discountedPrice != null && this.discountedPrice < this.price) {
    return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
  }
  return 0;
});

// Auto-generate a unique slug from the name.
productSchema.pre('validate', async function (next) {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });
    let candidate = base || `product-${Date.now()}`;
    let i = 1;
    // ensure uniqueness
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await model('Product').findOne({
        slug: candidate,
        _id: { $ne: this._id },
      });
      if (!exists) break;
      candidate = `${base}-${i++}`;
    }
    this.slug = candidate;
  }
  next();
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export type ProductDoc = HydratedDocument<IProduct>;
export const Product = model<IProduct>('Product', productSchema);
