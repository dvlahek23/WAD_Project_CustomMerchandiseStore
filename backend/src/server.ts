import { db } from './db/initDb';
import { seedDatabase } from './db/seed';
import app from './index';

const PORT = process.env.PORT || 3000;

db.ready().then(() => {
  return seedDatabase();
}).then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
