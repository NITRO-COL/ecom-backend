import { Schema, model, HydratedDocument } from 'mongoose';

/** Where on the site a banner renders. Extend freely. */
export type BannerPosition =
  | 'home-top'
  | 'home-mid'
  | 'home-footer'
  | 'product-page'
  | 'category-page'
  | 'cart-page'
  | 'global-top';

export const BANNER_POSITIONS: BannerPosition[] = [
  'home-top',
  'home-mid',
  'home-footer',
  'product-page',
  'category-page',
  'cart-page',
  'global-top',
];

export interface IBanner {
  title: string;
  image: string;
  mobileImage?: string;
  link?: string;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;

  // Scheduling
  startAt?: Date | null;     // banner not shown before this
  endAt?: Date | null;       // banner not shown after this (absolute date/time)
  durationHours?: number | null; // auto-hide N hours after startAt (or after creation)

  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    mobileImage: { type: String },
    link: { type: String, trim: true },
    position: {
      type: String,
      enum: BANNER_POSITIONS,
      required: true,
      index: true,
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    durationHours: { type: Number, default: null, min: 0 },
  },
  { timestamps: true }
);

/**
 * Computed "is this banner live right now" given schedule rules.
 * Effective end = min(endAt, startAt|createdAt + durationHours).
 */
bannerSchema.methods.isLive = function (this: IBanner, now: Date = new Date()): boolean {
  if (!this.isActive) return false;
  if (this.startAt && now < this.startAt) return false;
  if (this.endAt && now > this.endAt) return false;
  if (this.durationHours && this.durationHours > 0) {
    const anchor = this.startAt ?? this.createdAt;
    const expiry = new Date(anchor.getTime() + this.durationHours * 3600 * 1000);
    if (now > expiry) return false;
  }
  return true;
};

bannerSchema.set('toJSON', { virtuals: true });

export type BannerDoc = HydratedDocument<IBanner> & {
  isLive(now?: Date): boolean;
};
export const Banner = model<IBanner>('Banner', bannerSchema);
