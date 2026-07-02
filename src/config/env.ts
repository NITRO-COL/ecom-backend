import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined || val === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT ?? '5000', 10),

  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/'),
  dbName: required('DB_NAME', 'sanwariya'),

  jwtAdminSecret: required('JWT_ADMIN_SECRET', 'dev_admin_secret'),
  jwtCustomerSecret: required('JWT_CUSTOMER_SECRET', 'dev_customer_secret'),
  jwtAdminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN ?? '7d',
  jwtCustomerExpiresIn: process.env.JWT_CUSTOMER_EXPIRES_IN ?? '30d',

  adminEmail: required('ADMIN_EMAIL', 'admin@gmail.com'),
  adminPassword: required('ADMIN_PASSWORD', 'Admin@123'),
  adminName: process.env.ADMIN_NAME ?? 'Super Admin',

  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  adminOrigin: process.env.ADMIN_ORIGIN ?? 'http://localhost:3001',

  publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:5000',

  cloudinaryCloudName: required('CLOUDINARY_CLOUD_NAME', 'wwoo1e3p'),
  cloudinaryApiKey: required('CLOUDINARY_API_KEY', '225666741183477'),
  cloudinaryApiSecret: required('CLOUDINARY_API_SECRET', 'your_cloudinary_api_secret'),
};

const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

export const allowedOrigins = [
  env.webOrigin,
  env.adminOrigin,
  'https://sanwariya-brand-house.vercel.app',
  'https://sanwariya-brand-house-admin.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  ...extraOrigins,
];
