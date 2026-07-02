import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { Category } from '../models/Category';
import { Product } from '../models/Product';

/* ───────────── Public ───────────── */

export const listActiveCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, data: categories });
});

/* ───────────── Admin ───────────── */

export const adminListCategories = asyncHandler(async (_req: Request, res: Response) => {
  // Include product counts so admin sees usage before deleting.
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((c: { _id: string; count: number }) => [c._id, c.count]));
  const data = categories.map((c) => ({ ...c, productCount: countMap.get(c.slug) ?? 0 }));
  res.json({ success: true, data });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, image, isActive, sortOrder } = req.body as {
    name: string;
    description?: string;
    image?: string;
    isActive?: boolean;
    sortOrder?: number;
  };

  // Friendly duplicate check (case-insensitive) before relying on the unique index.
  const existing = await Category.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
  if (existing) throw AppError.conflict('A category with this name already exists');

  const category = await Category.create({ name, description, image, isActive, sortOrder });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw AppError.notFound('Category not found');

  const { name, description, image, isActive, sortOrder } = req.body as Record<string, unknown>;

  if (typeof name === 'string' && name.trim() && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const dup = await Category.findOne({
      _id: { $ne: category._id },
      name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
    });
    if (dup) throw AppError.conflict('A category with this name already exists');
  }

  const prevSlug = category.slug;
  if (typeof name === 'string') category.name = name; // slug regenerates in pre-validate
  if (description !== undefined) category.description = description as string;
  if (image !== undefined) category.image = image as string;
  if (typeof isActive === 'boolean') category.isActive = isActive;
  if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);

  await category.save();

  // Keep products in sync if the slug changed (since products store the slug).
  if (category.slug !== prevSlug) {
    await Product.updateMany({ category: prevSlug }, { category: category.slug });
  }

  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw AppError.notFound('Category not found');

  const inUse = await Product.countDocuments({ category: category.slug });
  if (inUse > 0) {
    throw AppError.conflict(
      `Cannot delete "${category.name}" — ${inUse} product(s) use it. Reassign or delete those products first.`
    );
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
