import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { db } from './db/initDb';
import productsRouter from './routes/products';
import authRouter from './routes/auth';

const app = express();

app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
}));


app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Backend radi!' });
});

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);

export default app;
