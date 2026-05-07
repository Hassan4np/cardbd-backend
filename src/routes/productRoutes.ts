import express from 'express';
import { 
  createCategory, getCategories, createProduct, getProducts, getProductById 
} from '../controllers/productController';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// ক্যাটাগরি রাউটস
router.post('/categories', verifyToken, verifyAdmin, createCategory); // শুধুমাত্র অ্যাডমিন পারবে
router.get('/categories', getCategories); // সবাই দেখতে পারবে

// প্রোডাক্ট রাউটস
router.post('/products', verifyToken, verifyAdmin, createProduct); // শুধুমাত্র অ্যাডমিন পারবে
router.get('/products', getProducts); // সবাই দেখতে পারবে
router.get('/products/:id', getProductById); // সিঙ্গেল প্রোডাক্ট ভিউ

export default router;