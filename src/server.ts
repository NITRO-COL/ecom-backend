import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { ensureSeed } from './seed';

async function startKeepAlive() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const selfUrl = process.env.SELF_URL;
  if (!selfUrl) {
    // eslint-disable-next-line no-console
    console.log('SELF_URL is not defined. Skipping self-ping keep-alive.');
    return;
  }

  // Ping every 10 minutes (10 * 60 * 1000 = 600000ms)
  setInterval(async () => {
    try {
      const url = `${selfUrl.replace(/\/$/, '')}/health`;
      const response = await fetch(url);
      // eslint-disable-next-line no-console
      console.log(`[Keep-Alive] Self-ping status: ${response.status}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`[Keep-Alive] Self-ping failed:`, error);
    }
  }, 10 * 60 * 1000);
}

async function bootstrap() {
  await connectDB();
  await ensureSeed(); // idempotent: admin user + default payment methods

  const port = process.env.PORT || 3000;
  const app = createApp();
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server is running on port ${port}`);
    startKeepAlive();
  });

  const shutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled Rejection:', reason);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err);
  process.exit(1);
});
