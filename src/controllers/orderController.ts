import { Response } from 'express';
import { CustomRequest } from '../middleware/authMiddleware';
import prisma from '../config/prisma';

// ১. নতুন অর্ডার তৈরি করা (Place Order)
export const placeOrder = async (req: CustomRequest, res: Response) => {
  const { items, shippingAddress, phone, paymentMethod } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized. User not found.' });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty. Cannot place order.' });
  }

  try {
    // প্রিজমা ট্রানজেকশন ব্যবহার করছি যাতে অর্ডারের সব কাজ একসাথে সফল হয়
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      // প্রতিটি কার্ট আইটেমের প্রাইজ ডাটাবেজ থেকে রিয়েল-টাইমে চেক করা
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found!`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        // অর্ডার আইটেম ডাটা অ্যারেতে পুশ করা
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        });

        // প্রোডাক্টের sold কাউন্ট বাড়িয়ে দেওয়া
        await tx.product.update({
          where: { id: product.id },
          data: {
            sold: {
              increment: item.quantity
            }
          }
        });
      }

      // ডাটাবেজে মেইন অর্ডার রেকর্ড তৈরি করা (টাইপস্ক্রিপ্ট এরর এড়াতে as any কাস্টিং করা হয়েছে)
      const newOrder = await (tx.order as any).create({
        data: {
          userId,
          totalAmount, // তোমার স্কিমা অনুযায়ী total_amount হলে এখানে total_amount: totalAmount লিখবে
          shippingAddress: shippingAddress || "Default Address",
          phone: phone || "Default Phone",
          paymentMethod: paymentMethod || "COD",
          status: "pending",
          orderItems: {
            create: orderItemsData // স্কিমা অনুযায়ী order_items হলে এখানে order_items লিখবে
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ২. লগইন করা ইউজারের সব অর্ডার দেখা (Get User Orders)
export const getUserOrders = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      } as any,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ৩. অ্যাডমিনের জন্য সব অর্ডার দেখা (Get All Orders - Admin Only)
export const getAllOrders = async (_req: CustomRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      } as any,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};