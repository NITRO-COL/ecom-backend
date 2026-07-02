import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAdmin } from '../middleware/auth';
import {
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,
} from '../validators';
import {
  listProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';

const router = Router();

// Public
router.get('/', validate(productQuerySchema, 'query'), listProducts);
router.get('/slug/:slug', getProductBySlug);

// Admin
router.get('/:id', requireAdmin, getProductById);
router.post('/', requireAdmin, validate(productCreateSchema), createProduct);
router.put('/:id', requireAdmin, validate(productUpdateSchema), updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

export default router;
