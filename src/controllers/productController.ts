import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ✅ নতুন Product তৈরি
export const createProduct = async (req: Request, res: Response) => {
  const {
    title, subtitle, price, old_price, category_name, brand,
    discount, offer, des, badge, endsIn, img, sub_img, features, tags
  } = req.body;

  // Validation
  if (!title || !price || !img) {
    return res.status(400).json({
      success: false,
      message: 'title, price এবং img required!'
    });
  }

  try {
    // Category খোঁজো
    let categoryId: string | null = null;
    if (category_name) {
      const category = await prisma.category.findUnique({
        where: { name: category_name }
      });
      if (category) categoryId = category.id;
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        subtitle: subtitle || null,
        price: parseFloat(price),
        oldPrice: old_price ? parseFloat(old_price) : null,
        brand: brand || 'Non-Brand',
        discount: discount ? parseInt(discount) : 0,
        offer: offer ? parseInt(offer) : 0,
        des: des || null,
        badge: badge || null,
        endsIn: endsIn || null,
        img,
        categoryId,
        subImages: {
          create: Array.isArray(sub_img)
            ? sub_img.map((url: string) => ({ imgUrl: url }))
            : []
        },
        meta: {
          create: [
            ...(Array.isArray(features)
              ? features.map((f: string) => ({ metaType: 'feature', value: f }))
              : []),
            ...(Array.isArray(tags)
              ? tags.map((t: string) => ({ metaType: 'tag', value: t }))
              : [])
          ]
        }
      },
      include: {
        subImages: true,
        meta: true,
        category: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      data: newProduct
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Helper: Product Format
const formatProduct = (product: any) => ({
  id: product.id,
  title: product.title,
  subtitle: product.subtitle,
  price: product.price,
  old_price: product.oldPrice,
  category: product.category?.name || 'Uncategorized',
  brand: product.brand,
  discount: product.discount,
  offer: product.offer,
  rating: product.rating,
  des: product.des,
  reviewCount: product.reviewCount,
  questionCount: product.questionCount,
  sold: product.sold,
  badge: product.badge,
  endsIn: product.endsIn,
  img: product.img,
  sub_img: product.subImages?.map((si: any) => si.imgUrl) || [],
  features: product.meta?.filter((m: any) => m.metaType === 'feature').map((m: any) => m.value) || [],
  tags: product.meta?.filter((m: any) => m.metaType === 'tag').map((m: any) => m.value) || [],
  reviews: product.reviews || [],
  createdAt: product.createdAt
});

// ✅ সব Product দেখো
export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        subImages: true,
        meta: true,
        reviews: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      total: products.length,
      data: products.map(formatProduct)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ একটি Product দেখো
export const getProductById = async (req: Request, res: Response) => {
  const id = req.params.id as string; // ✅ UUID — parseInt নয়!

  try {
    const product = await prisma.product.findUnique({
      where: { id }, // ✅ সরাসরি string id
      include: {
        category: true,
        subImages: true,
        meta: true,
        reviews: true
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    return res.status(200).json({ success: true, data: formatProduct(product) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Product আপডেট করো
export const updateProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    // Body থেকে data নাও
    const {
      title, subtitle, price, old_price, category_name,
      brand, discount, offer, des, badge, endsIn, img,
      sub_img, features, tags
    } = req.body;

    // Category resolve করো
    let categoryId: string | null = exists.categoryId; // আগের value রাখো
    if (category_name !== undefined) {
      if (category_name === null || category_name === '') {
        categoryId = null;
      } else {
        const category = await prisma.category.findUnique({
          where: { name: category_name }
        });
        categoryId = category ? category.id : null;
      }
    }

    // ✅ Main product update
    const updated = await prisma.product.update({
      where: { id },
      data: {
        title:      title      ?? exists.title,
        subtitle:   subtitle   ?? exists.subtitle,
        price:      price      ? parseFloat(price)    : exists.price,
        oldPrice:   old_price  ? parseFloat(old_price): exists.oldPrice,
        brand:      brand      ?? exists.brand,
        discount:   discount   !== undefined ? parseInt(discount) : exists.discount,
        offer:      offer      !== undefined ? parseInt(offer)    : exists.offer,
        des:        des        ?? exists.des,
        badge:      badge      ?? exists.badge,
        endsIn:     endsIn     ?? exists.endsIn,
        img:        img        ?? exists.img,
        categoryId,
      },
    });

    // ✅ SubImages আপডেট — পুরনো মুছে নতুন দাও
    if (Array.isArray(sub_img)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: sub_img.map((url: string) => ({ productId: id, imgUrl: url }))
      });
    }

    // ✅ Features আপডেট
    if (Array.isArray(features)) {
      await prisma.productMeta.deleteMany({
        where: { productId: id, metaType: 'feature' }
      });
      await prisma.productMeta.createMany({
        data: features.map((f: string) => ({
          productId: id, metaType: 'feature', value: f
        }))
      });
    }

    // ✅ Tags আপডেট
    if (Array.isArray(tags)) {
      await prisma.productMeta.deleteMany({
        where: { productId: id, metaType: 'tag' }
      });
      await prisma.productMeta.createMany({
        data: tags.map((t: string) => ({
          productId: id, metaType: 'tag', value: t
        }))
      });
    }

    // ✅ Updated product ফেরত দাও
    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subImages: true,
        meta: true,
        reviews: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      data: formatProduct(finalProduct)
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Product মুছো
export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully!'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};