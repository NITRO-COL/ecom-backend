import { connectDB } from './config/db';
import { env } from './config/env';
import { User } from './models/User';
import { PaymentSetting, DEFAULT_PAYMENT_METHODS } from './models/PaymentSetting';
import { Product } from './models/Product';
import { Category, DEFAULT_CATEGORIES } from './models/Category';

/** Idempotent: safe to run on every boot. Creates missing baseline data only. */
export async function ensureSeed(): Promise<void> {
  // 1) Default admin
  const existingAdmin = await User.findOne({ email: env.adminEmail.toLowerCase() });
  if (!existingAdmin) {
    await User.create({
      name: env.adminName,
      email: env.adminEmail,
      password: env.adminPassword,
      role: 'admin',
    });
    // eslint-disable-next-line no-console
    console.log(`👤 Seeded admin: ${env.adminEmail} / ${env.adminPassword}`);
  }

  // 2) Payment methods
  for (const m of DEFAULT_PAYMENT_METHODS) {
    await PaymentSetting.updateOne({ key: m.key }, { $setOnInsert: m }, { upsert: true });
  }

  // 3) Default categories (idempotent; admin can add more dynamically)
  for (const c of DEFAULT_CATEGORIES) {
    await Category.updateOne({ slug: c.slug }, { $setOnInsert: c }, { upsert: true });
  }
}

const SAMPLE_PRODUCTS = [
  {
    name: 'Classic Leather Sneakers',
    shortDescription: 'Premium handcrafted leather sneakers for everyday style.',
    longDescription:
      'Crafted from genuine leather with a cushioned insole and durable rubber outsole. A timeless silhouette that pairs with everything.',
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
    price: 2999,
    discountedPrice: 1999,
    category: 'shoes',
    sizes: ['6', '7', '8', '9', '10'],
    colors: ['Black', 'White'],
    stock: 25,
    isFeatured: true,
  },
  {
    name: 'Sanwariya Signature Hoodie',
    shortDescription: 'Soft fleece hoodie with the Sanwariya emblem.',
    longDescription:
      'Heavyweight cotton-blend fleece, ribbed cuffs, and a relaxed fit. Stay cozy in signature style.',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
    price: 1799,
    discountedPrice: 1299,
    category: 'clothing',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Grey'],
    stock: 40,
    isFeatured: true,
  },
  {
    name: 'Urban Running Shoes',
    shortDescription: 'Lightweight running shoes with responsive cushioning.',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
    price: 3499,
    discountedPrice: 2499,
    category: 'shoes',
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['Red', 'Black'],
    stock: 18,
    isFeatured: false,
  },
  {
    name: 'Premium Cotton T-Shirt',
    shortDescription: '100% combed cotton crew-neck tee.',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
    price: 799,
    discountedPrice: 499,
    category: 'clothing',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Navy'],
    stock: 60,
    isFeatured: true,
  },
  {
    name: 'Leather Strap Watch',
    shortDescription: 'Minimalist analog watch with genuine leather strap.',
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800'],
    price: 2499,
    category: 'accessories',
    stock: 12,
    isFeatured: false,
  },
  {
    name: 'Canvas Backpack',
    shortDescription: 'Durable everyday backpack with laptop sleeve.',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
    price: 1599,
    discountedPrice: 1199,
    category: 'accessories',
    colors: ['Khaki', 'Black'],
    stock: 22,
    isFeatured: true,
  },
];

/** Optional sample-product seeding (only when collection empty). */
export async function seedSampleProducts(): Promise<void> {
  const count = await Product.countDocuments();
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`ℹ️  Products already exist (${count}); skipping sample products.`);
    return;
  }
  for (const p of SAMPLE_PRODUCTS) {
    // create() one-by-one so slug pre-validate hook runs
    // eslint-disable-next-line no-await-in-loop
    await Product.create(p);
  }
  // eslint-disable-next-line no-console
  console.log(`🛍️  Seeded ${SAMPLE_PRODUCTS.length} sample products.`);
}

// Standalone runner: `npm run seed`
if (require.main === module) {
  (async () => {
    await connectDB();
    await ensureSeed();
    await seedSampleProducts();
    // eslint-disable-next-line no-console
    console.log('✅ Seeding complete.');
    process.exit(0);
  })().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed error:', err);
    process.exit(1);
  });
}
