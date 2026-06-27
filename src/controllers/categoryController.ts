import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ✅ সব Category দেখো
export const getAllCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        img: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      total: categories.length,
      categories,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ একটি Category দেখো
export const getCategoryById = async (req: Request, res: Response) => {
  const id = req.params.id as string;;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            title: true,
            price: true,
            img: true,
            rating: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found!' });
    }

    return res.status(200).json({ success: true, category });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Category তৈরি করো
export const createCategory = async (req: Request, res: Response) => {
  const name = req.body?.name;
  const img = req.body?.img;

  // console.log('Body received:', req.body); // ← debug এর জন্য

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Category name is required!' });
  }

  try {
    const categoryExists = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists!' });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        img: img || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      category: newCategory,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Category আপডেট করো
export const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, img } = req.body;

  // কমপক্ষে একটা field থাকতে হবে
  if (!name && img === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name or img to update!',
    });
  }

  try {
    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Category not found!' });
    }

    // নাম দিলে duplicate check করো
    if (name && name.trim() !== exists.name) {
      const nameTaken = await prisma.category.findUnique({
        where: { name: name.trim() },
      });
      if (nameTaken) {
        return res.status(400).json({
          success: false,
          message: 'Category name already taken!',
        });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(img !== undefined && { img }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully!',
      category: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Category মুছো
export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Category not found!' });
    }

    // Products আছে কিনা check করো
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete! This category has ${productCount} product(s). Remove products first or reassign them.`,
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully!',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};