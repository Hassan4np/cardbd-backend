import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ✅ Register - সাধারণ user
export const register = async (req: Request, res: Response) => {
  const { name, email, phone, password, confirm_password } = req.body;

  try {
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match!' });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role: 'user',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password!' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password!' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Register Admin - secret_key নেই, middleware দিয়ে verify হবে
export const registerAdmin = async (req: Request, res: Response) => {
  const { name, email, phone, password, confirm_password } = req.body;

  try {
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match!' });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role: 'admin',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully!',
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Get All Users - শুধু admin দেখতে পাবে
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};