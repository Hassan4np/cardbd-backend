import { Router } from 'express';
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  updateOrder
} from '../controllers/orderController';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', createOrder);

// Admin only
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.get('/:id', verifyToken, verifyAdmin, getOrderById);
router.put('/:id', verifyToken, verifyAdmin, updateOrder);
router.delete('/:id', verifyToken, verifyAdmin, deleteOrder);

export default router;