import { Router } from 'express';
import {
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
  deleteCustomer,
} from '../../../controllers/admin/customerController';

const router = Router();

// GET /api/v1/admin/customers - Get all customers
router.get('/', getAdminCustomers);

// GET /api/v1/admin/customers/:id - Get single customer with order history
router.get('/:id', getAdminCustomerById);

// PUT /api/v1/admin/customers/:id/status - Update customer status
router.put('/:id/status', updateCustomerStatus);

// DELETE /api/v1/admin/customers/:id - Delete customer
router.delete('/:id', deleteCustomer);

export default router;

