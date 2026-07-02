import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { Banner, BannerDoc } from '../models/Banner';

/* ───────────── Public: only live banners for a position ───────────── */

export const getLiveBanners = asyncHandler(async (req: Request, res: Response) => {
  const { position } = req.query as { position?: string };
  const filter: Record<string, unknown> = { isActive: true };
  if (position) filter.position = position;

  const banners = (await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 })) as BannerDoc[];
  const now = new Date();
  const live = banners.filter((b) => b.isLive(now));

  res.json({ success: true, data: live });
});

/* ───────────── Admin CRUD ───────────── */

export const adminListBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find().sort({ position: 1, sortOrder: 1, createdAt: -1 });
  res.json({ success: true, data: banners });
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, data: banner });
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!banner) throw AppError.notFound('Banner not found');
  res.json({ success: true, data: banner });
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw AppError.notFound('Banner not found');
  res.json({ success: true, message: 'Banner deleted' });
});
