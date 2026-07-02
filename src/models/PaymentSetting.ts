import { Schema, model, HydratedDocument } from 'mongoose';

export type PaymentMethodKey = 'cod' | 'prepaid';

export interface IPaymentSetting {
  key: PaymentMethodKey;
  label: string;
  description?: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSettingSchema = new Schema<IPaymentSetting>(
  {
    key: {
      type: String,
      enum: ['cod', 'prepaid'],
      required: true,
      unique: true,
      index: true,
    },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isEnabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type PaymentSettingDoc = HydratedDocument<IPaymentSetting>;
export const PaymentSetting = model<IPaymentSetting>('PaymentSetting', paymentSettingSchema);

export const DEFAULT_PAYMENT_METHODS: Omit<
  IPaymentSetting,
  'createdAt' | 'updatedAt'
>[] = [
  {
    key: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay with cash when your order is delivered.',
    isEnabled: true,
    sortOrder: 1,
  },
  {
    key: 'prepaid',
    label: 'Prepaid (Online Payment)',
    description: 'Pay online in advance.',
    isEnabled: true,
    sortOrder: 2,
  },
];
