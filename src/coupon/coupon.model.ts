import { MongooseModule } from "@nestjs/mongoose";
import { CouponSchema, UsedCouponSchema } from "./coupon.schema";

export const CouponModel = MongooseModule.forFeature([
  { name: "Coupon", schema: CouponSchema },
]);

export const UsedCouponModel = MongooseModule.forFeature([
  { name: "UsedCoupon", schema: UsedCouponSchema },
]);
