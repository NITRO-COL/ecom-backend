import { AdminTokenPayload, CustomerTokenPayload } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
      customer?: CustomerTokenPayload;
    }
  }
}

export {};
