import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/authRoutes';
// import productRoutes from './routes/productRoutes';
// import orderRoutes from './routes/orderRoutes';


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes Connection
app.use('/api/v1', authRoutes);
// app.use('/api/v1', productRoutes);
// app.use('/api/v1', orderRoutes);

// Base Route
app.get('/', (_req: Request, res: Response) => {
  res.send('CartBD E-commerce  is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});