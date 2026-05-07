import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ==========================================
// ১. ক্যাটাগরি কন্ট্রোলারস (Category)
// ==========================================

// নতুন ক্যাটাগরি তৈরি করা
export const createCategory = async (req: Request, res: Response) => {
    const { name, img } = req.body;
    try {
        const categoryExists = await prisma.category.findUnique({ where: { name } });
        if (categoryExists) {
            return res.status(400).json({ success: false, message: 'Category already exists!' });
        }

        const newCategory = await prisma.category.create({
            data: { name, img }
        });

        return res.status(201).json({ success: true, data: newCategory });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// সব ক্যাটাগরি গেট করা
export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany();
        return res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};


// ==========================================
// ২. প্রোডাক্ট কন্ট্রোলারস (Product)
// ==========================================

// নতুন প্রোডাক্ট তৈরি করা (ফিচার, ট্যাগ ও সাব-ইমেজ সহ)
export const createProduct = async (req: Request, res: Response) => {
    const {
        title, subtitle, price, old_price, category_name, brand,
        discount, offer, des, badge, endsIn, img, sub_img, features, tags
    } = req.body;

    try {
        //প্রথমে চেক করব ক্যাটাগরি ডাটাবেজে আছে কিনা, না থাকলে আইডি null থাকবে
        let categoryId: number | null = null;
        if (category_name) {
            const category = await prisma.category.findUnique({ where: { name: category_name } });
            if (category) categoryId = category.id;
        }

        // প্রিজমা ট্রানজেকশন ব্যবহার করে প্রোডাক্ট এবং তার রিলেটেড ডাটা একসাথে ইনসার্ট করা
        const newProduct = await prisma.product.create({
            data: {
                title,
                subtitle,
                price: parseFloat(price),
                oldPrice: old_price ? parseFloat(old_price) : null,
                brand: brand || "Non-Brand",
                discount: discount ? parseInt(discount) : 0,
                offer: offer ? parseInt(offer) : 0,
                des,
                badge,
                endsIn,
                img, // মেইন ইমেজ
                categoryId,
                // সাব-ইমেজ লিস্ট ম্যাপ করে ইনসার্ট
                subImages: {
                    create: sub_img?.map((url: string) => ({ imgUrl: url })) || []
                },
                // ফিচার এবং ট্যাগগুলোকে মেটা টেবিলে ইনসার্ট করা
                meta: {
                    create: [
                        ...(features?.map((f: string) => ({ metaType: 'feature', value: f })) || []),
                        ...(tags?.map((t: string) => ({ metaType: 'tag', value: t })) || [])
                    ]
                }
            },
            include: {
                subImages: true,
                meta: true
            }
        });

        return res.status(201).json({ success: true, message: 'Product created successfully!', data: newProduct });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// সব প্রোডাক্ট গেট করা (রিলেশনাল ডাটা ফরম্যাট গুছিয়ে)
export const getProducts = async (_req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
                subImages: true,
                meta: true,
                reviews: true
            }
        });

        // ডাটাকে তোমার ফ্রন্টএন্ডের আগের অবজেক্ট ফরম্যাটে কনভার্ট করা (ট্যাগ এবং ফিচার অ্যারেতে রূপান্তর)
        const formattedProducts = products.map(product => {
            const subImagesArray = product.subImages.map(si => si.imgUrl);
            const featuresArray = product.meta.filter(m => m.metaType === 'feature').map(m => m.value);
            const tagsArray = product.meta.filter(m => m.metaType === 'tag').map(m => m.value);

            return {
                id: product.id,
                title: product.title,
                subtitle: product.subtitle,
                price: product.price,
                old_price: product.oldPrice,
                category: product.category?.name || "Uncategorized",
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
                sub_img: subImagesArray,
                features: featuresArray,
                tags: tagsArray,
                review: product.reviews
            };
        });

        return res.status(200).json({ success: true, data: formattedProducts });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// সিঙ্গেল প্রোডাক্ট ডিটেইলস (আইডি ধরে)
export const getProductById = async (req: Request, res: Response) => {
    // এখানে id কে string হিসেবে টাইপ কাস্টিং করে দেওয়া হলো
    const id = req.params.id as string;

    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) }, // এখন parseInt আর কোনো এরর দেবে না
            include: { category: true, subImages: true, meta: true, reviews: true }
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found!' });
        }

        // ফরম্যাটিং
        const formattedProduct = {
            id: product.id,
            title: product.title,
            subtitle: product.subtitle,
            price: product.price,
            old_price: product.oldPrice,
            category: product.category?.name || "Uncategorized",
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
            sub_img: product.subImages.map(si => si.imgUrl),
            features: product.meta.filter(m => m.metaType === 'feature').map(m => m.value),
            tags: product.meta.filter(m => m.metaType === 'tag').map(m => m.value),
            review: product.reviews
        };

        return res.status(200).json({ success: true, data: formattedProduct });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};