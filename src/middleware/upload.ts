import multer from 'multer';
import { AppError } from '../utils/AppError';

const storage = multer.memoryStorage();

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5MB each, up to 8 files
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Only JPG, PNG, WEBP, GIF or AVIF images are allowed', 400));
  },
});
