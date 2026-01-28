import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { db } from './db/initDb';
import productsRouter from './routes/products';
import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import reviewsRouter from './routes/reviews';


const app = express();

app.use(express.json({ limit: '10mb' }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}));



app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Backend radi!' });
});

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter); 


export default app;
