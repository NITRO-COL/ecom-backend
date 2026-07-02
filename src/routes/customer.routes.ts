import { Router } from 'express';
import { requireAdmin, requireCustomer } from '../middleware/auth';
import {
  adminListCustomers,
  adminGetCustomer,
  adminToggleCustomer,
  adminListGuests,
  updateProfile,
  addAddress,
  deleteAddress,
} from '../controllers/customer.controller';

const router = Router();

// Customer self-service
router.put('/me', requireCustomer, updateProfile);
router.post('/me/addresses', requireCustomer, addAddress);
router.delete('/me/addresses/:addressId', requireCustomer, deleteAddress);

// Admin
router.get('/admin', requireAdmin, adminListCustomers);
router.get('/admin/guests', requireAdmin, adminListGuests);
router.get('/admin/:id', requireAdmin, adminGetCustomer);
router.patch('/admin/:id/toggle', requireAdmin, adminToggleCustomer);

export default router;
