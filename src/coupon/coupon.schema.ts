import * as mongoose from "mongoose";

import { Coupon, UsedCoupon } from "./coupon.interface";

export const CouponSchema = new mongoose.Schema<Coupon>(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Customer" },
    code: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true },
);

/**
 * Methods.
 */
CouponSchema.methods.getPublicData = function () {
  const { _id, customerId, code, isActive } = this;
  return { _id, customerId, code, isActive };
};

export const UsedCouponSchema = new mongoose.Schema<UsedCoupon>(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Customer" },
    couponId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Coupon" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true },
);

/**
 * Methods.
 */
UsedCouponSchema.methods.getPublicData = function () {
  const { _id, customerId, couponId, isActive } = this;
  return { _id, customerId, couponId, isActive };
};

