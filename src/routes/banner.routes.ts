import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAdmin } from '../middleware/auth';
import { bannerCreateSchema, bannerUpdateSchema } from '../validators';
import {
  getLiveBanners,
  adminListBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/banner.controller';

const router = Router();

// Public
router.get('/', getLiveBanners);

// Admin
router.get('/admin', requireAdmin, adminListBanners);
router.post('/', requireAdmin, validate(bannerCreateSchema), createBanner);
router.put('/:id', requireAdmin, validate(bannerUpdateSchema), updateBanner);
router.delete('/:id', requireAdmin, deleteBanner);

export default router;
