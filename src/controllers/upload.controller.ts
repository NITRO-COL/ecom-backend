import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

/** Returns public URLs for uploaded images. */
export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) throw AppError.badRequest('No image file received');

  const urls = files.map((f) => `${env.publicUrl}/uploads/${f.filename}`);
  res.status(201).json({ success: true, urls, url: urls[0] });
});
