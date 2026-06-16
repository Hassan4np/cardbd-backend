import express from 'express';
import { register, login, registerAdmin, getAllUsers } from '../controllers/authController';
import { verifyToken, CustomRequest, verifyAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/register-admin', verifyToken, verifyAdmin, registerAdmin);
router.get('/users', verifyToken, verifyAdmin, getAllUsers);  
router.get('/profile', verifyToken, (req: CustomRequest, res) => {
  return res.json({ success: true, message: 'User profile data', user: req.user });
});

export default router;