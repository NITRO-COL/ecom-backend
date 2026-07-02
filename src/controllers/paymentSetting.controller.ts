import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { PaymentSetting } from '../models/PaymentSetting';

/* ───────────── Public: only enabled methods ───────────── */

export const getEnabledPaymentMethods = asyncHandler(async (_req: Request, res: Response) => {
  const methods = await PaymentSetting.find({ isEnabled: true }).sort({ sortOrder: 1 });
  res.json({ success: true, data: methods });
});

/* ───────────── Admin ───────────── */

export const adminListPaymentMethods = asyncHandler(async (_req: Request, res: Response) => {
  const methods = await PaymentSetting.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: methods });
});

export const togglePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const { isEnabled } = req.body as { isEnabled: boolean };
  const method = await PaymentSetting.findOneAndUpdate(
    { key: req.params.key },
    { isEnabled },
    { new: true }
  );
  if (!method) throw AppError.notFound('Payment method not found');
  res.json({ success: true, data: method });
});
