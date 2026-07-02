import { Schema, model, HydratedDocument, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}

export interface ICustomer {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  addresses: IAddress[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ICustomerMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

type CustomerModel = Model<ICustomer, {}, ICustomerMethods>;

const addressSchema = new Schema<IAddress>(
  {
    label: { type: String, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const customerSchema = new Schema<ICustomer, CustomerModel, ICustomerMethods>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },
    phone: { type: String, trim: true, index: true },
    password: { type: String, select: false, minlength: 6 },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

customerSchema.methods.comparePassword = function (candidate: string) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

customerSchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as unknown as Record<string, unknown>).password;
    return ret;
  },
});

export type CustomerDoc = HydratedDocument<ICustomer, ICustomerMethods>;
export const Customer = model<ICustomer, CustomerModel>('Customer', customerSchema);
