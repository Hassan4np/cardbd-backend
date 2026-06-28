import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getProductsByCategory,
  updateProduct
} from '../controllers/productController';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Public
router.get('/', getProducts);
// ✅ categoryId → categoryName
router.get('/category/:categoryName', getProductsByCategory);
router.get('/:id', getProductById);

// Admin only
router.post('/', verifyToken, verifyAdmin, createProduct);
router.put('/:id', verifyToken, verifyAdmin, updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

export default router;