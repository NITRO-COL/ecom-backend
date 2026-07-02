import { Schema, model, HydratedDocument } from 'mongoose';
import slugify from 'slugify';

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true },
    image: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate a unique slug from the name.
categorySchema.pre('validate', async function (next) {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });
    let candidate = base || `category-${Date.now()}`;
    let i = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await model('Category').findOne({ slug: candidate, _id: { $ne: this._id } });
      if (!exists) break;
      candidate = `${base}-${i++}`;
    }
    this.slug = candidate;
  }
  next();
});

export type CategoryDoc = HydratedDocument<ICategory>;
export const Category = model<ICategory>('Category', categorySchema);

export const DEFAULT_CATEGORIES = [
  { name: 'Shoes', slug: 'shoes', sortOrder: 1 },
  { name: 'Clothing', slug: 'clothing', sortOrder: 2 },
  { name: 'Accessories', slug: 'accessories', sortOrder: 3 },
  { name: 'Other', slug: 'other', sortOrder: 4 },
];
