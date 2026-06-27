import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ✅ Order তৈরি করো (Checkout)
export const createOrder = async (req: Request, res: Response) => {
  const { customer, products, delivery, total, method } = req.body;

  if (!customer || !products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'customer এবং products required!'
    });
  }

  if (!customer.email || !customer.name || !customer.phone || !customer.address) {
    return res.status(400).json({
      success: false,
      message: 'customer এর email, name, phone, address required!'
    });
  }

  try {
    const order = await prisma.order.create({
      data: {
        email:          customer.email,
        customerName:   customer.name,
        phone:          customer.phone,
        address:        customer.address,
        status:         'pending',
        method:         method || 'Cash on delivery',
        deliveryCharge: delivery || 0,
        total:          total || 0,
        userId:         null, // ✅ login ছাড়া order — userId null থাকবে
        items: {
          create: products.map((item: {
            id: string;
            title: string;
            price: number;
            quantity: number;
          }) => ({
            productId: item.id,
            title:     item.title,
            price:     item.price,
            quantity:  item.quantity,
          }))
        }
      },
      include: { items: true }
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: {
        orderId: order.id,
        status:  order.status,
        total:   order.total,
        items:   order.items,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ সব Order দেখো (Admin)
export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      total: orders.length,
      data: orders
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ একটি Order দেখো
export const getOrderById = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Order Status আপডেট (Admin)
// ✅ Order যেকোনো কিছু আপডেট করো
export const updateOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, phone, address, email, status, delivery, total, method } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status হবে: ${validStatuses.join(', ')}`
    });
  }

  // কমপক্ষে একটা field লাগবে
  if (!name && !phone && !address && !email && !status && delivery === undefined && total === undefined && !method) {
    return res.status(400).json({
      success: false,
      message: 'কমপক্ষে একটা field দাও!'
    });
  }

  try {
    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(name     && { customerName: name }),
        ...(phone    && { phone }),
        ...(address  && { address }),
        ...(email    && { email }),
        ...(status   && { status }),
        ...(method   && { method }),
        ...(delivery !== undefined && { deliveryCharge: delivery }),
        ...(total    !== undefined && { total }),
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully!',
      data: updated
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Order মুছো (Admin)
export const deleteOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const exists = await prisma.order.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    await prisma.order.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully!'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};