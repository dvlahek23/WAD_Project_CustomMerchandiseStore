import express from 'express';
import session from 'express-session';
import cors from 'cors';

const app = express();

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
}));

app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// test endpoint
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Backend radi!' });
});

export default app;
