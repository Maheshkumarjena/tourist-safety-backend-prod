import app from './app';
import { connectDB } from './config/db';
import { logger } from './config/logger';

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});