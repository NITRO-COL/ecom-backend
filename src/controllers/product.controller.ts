import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { Product, IProduct } from '../models/Product';
import { Category } from '../models/Category';

/** Ensures a category slug exists; throws a clean 400 otherwise. */
async function assertCategoryExists(slug: string): Promise<void> {
  const exists = await Category.findOne({ slug });
  if (!exists) {
    throw AppError.badRequest(`Category "${slug}" does not exist. Please create it first.`);
  }
}

/* ───────────── Public ───────────── */

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, category, search, sort, featured, minPrice, maxPrice, status } =
    req.query as unknown as {
      page: number;
      limit: number;
      category?: string;
      search?: string;
      sort: string;
      featured?: boolean;
      minPrice?: number;
      maxPrice?: number;
      status?: 'all' | 'active' | 'inactive';
    };

  const filter: FilterQuery<IProduct> = {};

  // Public requests only ever see active products; admin can pass status=all.
  if (req.admin) {
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;
  } else {
    filter.isActive = true;
  }

  if (category) filter.category = category as IProduct['category'];
  if (featured !== undefined) filter.isFeatured = featured;
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) (filter.price as Record<string, number>).$gte = minPrice;
    if (maxPrice != null) (filter.price as Record<string, number>).$lte = maxPrice;
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    featured: { isFeatured: -1, createdAt: -1 },
  };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sortMap[sort] ?? sortMap.newest).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product || (!product.isActive && !req.admin)) throw AppError.notFound('Product not found');
  res.json({ success: true, data: product });
});

/* ───────────── Admin ───────────── */

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw AppError.notFound('Product not found');
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  await assertCategoryExists(req.body.category);
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw AppError.notFound('Product not found');
  if (req.body.category) await assertCategoryExists(req.body.category);
  Object.assign(product, req.body);
  await product.save(); // runs validators + slug regeneration
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw AppError.notFound('Product not found');
  res.json({ success: true, message: 'Product deleted' });
});
