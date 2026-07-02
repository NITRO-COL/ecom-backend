import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadImages } from '../controllers/upload.controller';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

// Image upload (admin only) — field name: "images" (supports multiple)
router.post('/upload', requireAdmin, upload.array('images', 8), uploadImages);

// Dashboard stats (admin only)
router.get('/dashboard/stats', requireAdmin, getDashboardStats);

export default router;
