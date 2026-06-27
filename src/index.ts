import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.send('CartBD E-commerce is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});