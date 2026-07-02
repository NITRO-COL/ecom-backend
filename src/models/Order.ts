import { Schema, model, HydratedDocument, Types } from 'mongoose';
import { PaymentMethodKey } from './PaymentSetting';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  image?: string;
  slug?: string;
  size?: string;
  color?: string;
  unitPrice: number; // effective price at time of order
  quantity: number;
  lineTotal: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
}

export interface IStatusEvent {
  status: OrderStatus;
  note?: string;
  at: Date;
}

export interface IOrder {
  orderNumber: string;
  customer?: Types.ObjectId | null; // null => guest order
  isGuest: boolean;
  guestToken?: string; // lets a guest look up their own order securely

  contactEmail?: string;
  contactPhone: string;

  items: IOrderItem[];
  shippingAddress: IShippingAddress;

  itemsTotal: number;
  shippingFee: number;
  discountTotal: number;
  grandTotal: number;

  paymentMethod: PaymentMethodKey;
  paymentStatus: PaymentStatus;

  status: OrderStatus;
  statusHistory: IStatusEvent[];

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    slug: { type: String },
    size: { type: String },
    color: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const statusEventSchema = new Schema<IStatusEvent>(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
    isGuest: { type: Boolean, default: false, index: true },
    guestToken: { type: String, index: true, select: false },

    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, required: true, trim: true, index: true },

    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },

    itemsTotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },

    paymentMethod: { type: String, enum: ['cod', 'prepaid'], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid', index: true },

    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: { type: [statusEventSchema], default: [] },

    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export type OrderDoc = HydratedDocument<IOrder>;
export const Order = model<IOrder>('Order', orderSchema);
