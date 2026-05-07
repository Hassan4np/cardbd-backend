import express from 'express';
import { register, login } from '../controllers/authController';
import { verifyToken, CustomRequest } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/profile', verifyToken, (req: CustomRequest, res) => {
  return res.json({ success: true, message: 'User profile data', user: req.user });
});

export default router;