// import express from 'express';
// import { placeOrder, getUserOrders, getAllOrders } from '../controllers/orderController';
// import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

// const router = express.Router();

// // কাস্টমার প্রটেক্টেড রাউটস (লগইন করা ইউজার ছাড়া অর্ডার করা বা দেখা যাবে না)
// router.post('/orders', placeOrder); 
// router.get('/orders/my-orders', verifyToken, getUserOrders);

// // অ্যাডমিন প্রটেক্টেড রাউট (শুধুমাত্র অ্যাডমিন পুরো ওয়েবসাইটের সব অর্ডার দেখতে পারবে)
// router.get('/orders/admin/all', verifyToken, verifyAdmin, getAllOrders);

// export default router;