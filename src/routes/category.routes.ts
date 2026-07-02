import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAdmin } from '../middleware/auth';
import { categoryCreateSchema, categoryUpdateSchema } from '../validators';
import {
  listActiveCategories,
  adminListCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';

const router = Router();

// Public
router.get('/', listActiveCategories);

// Admin
router.get('/admin', requireAdmin, adminListCategories);
router.post('/', requireAdmin, validate(categoryCreateSchema), createCategory);
router.put('/:id', requireAdmin, validate(categoryUpdateSchema), updateCategory);
router.delete('/:id', requireAdmin, deleteCategory);

export default router;
