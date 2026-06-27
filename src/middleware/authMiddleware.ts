import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface CustomRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  // ১. হেডার থেকে সরাসরি টোকেন নেওয়া
  const token = req.headers.authorization;

  // console.log('Received Token:', token);

  if (!token || token.trim() === '') {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    // ৩. সরাসরি টোকেনটি ভেরিফাই করা
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as CustomRequest['user'];
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const verifyAdmin = (req: CustomRequest, res: Response, next: NextFunction) => {
  // ✅ verifyToken আগে না চললে user থাকবে না
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
};