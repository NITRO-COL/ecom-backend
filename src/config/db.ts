import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri, {
      dbName: env.dbName,
      serverSelectionTimeoutMS: 8000,
      autoIndex: !env.isProd, // build indexes in dev; manage manually in prod
    });
    // eslint-disable-next-line no-console
    console.log(`✅ MongoDB connected → ${env.mongoUri}${env.dbName}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection error:', (err as Error).message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('⚠️  MongoDB disconnected');
  });
}
