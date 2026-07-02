import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

/** Helper to upload a buffer to Cloudinary using upload_stream */
const uploadToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sanwariya-ecommerce' },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload result is undefined'));
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
};

/** Returns public URLs for uploaded images. */
export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length === 0) throw AppError.badRequest('No image file received');

  try {
    // Upload all files in parallel
    const uploadPromises = files.map((file) => uploadToCloudinary(file));
    const urls = await Promise.all(uploadPromises);

    res.status(201).json({ success: true, urls, url: urls[0] });
  } catch (error: any) {
    throw new AppError(`Cloudinary Upload Error: ${error.message || error}`, 500);
  }
});
