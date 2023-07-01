import { Model, ObjectId } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Coupon, CouponDto, UsedCoupon  } from "./coupon.interface";
import { User, UserType } from "../user/user.interface";
import { ErrorMessageException } from "../common/exceptions";
import { create } from "lodash";

@Injectable()
export class CouponService {
  constructor(
    @InjectModel("Coupon") private readonly couponModel: Model<Coupon>,
    @InjectModel("UsedCoupon") private readonly usedCouponModel: Model<UsedCoupon>
    
  ) { }


  async createUsedCoupon(usedCoupon: Partial<UsedCoupon>) {
    await this.usedCouponModel.create(usedCoupon);
  }

  couponGenerator(couponLength: number) {
    let coupon = '';
    const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < couponLength; i++) {
      coupon += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return coupon.toUpperCase();
  }
  async findCouponsForAdmin(): Promise<Coupon[]> {
    const coupons = await this.couponModel.find({
      isActive: true
    })
    return [...coupons.filter(({ isActive }) => isActive)];
  }

  async getCustomerCoupon(customerId: ObjectId): Promise<Coupon> {
    const coupon = await this.couponModel.findOne({
      customerId,
      isActive: true
    });
    if (!coupon) {
      const code = this.couponGenerator(6);
      let existingCode = this.couponModel.find({
        isActive: true,
        code
      });
      while (!existingCode) {
        let code = this.couponGenerator(6);
        existingCode = this.couponModel.find({
          isActive: true,
          code
        });
      }
      const newCoupon = await this.couponModel.create({
        code,
        customerId,
      });
      return newCoupon;
    }
    return coupon;
  }

  getCouponById(id: ObjectId) {
    return this.couponModel.findById(id);
  }

  async findByCode(code: string | undefined, customerId: ObjectId): Promise<{
    coupon: Coupon | null,
    message: string
  }> {
    if (!code) {
      return {
        coupon: null,
        message: ''
      }
    }
    const coupon = await this.couponModel.findOne({
      isActive: true,
      code
    });
    if (coupon) {
      const isCouponUsed = await this.usedCouponModel.findOne({
        couponId: coupon._id,
        customerId,
        isActive: true
      });
      if (isCouponUsed) {
        return {
          coupon: null,
          message: 'Coupon is already used'
        }
      } else {
        return {
          coupon: coupon,
          message: ''
        }
      }
    }
    return {
      message: 'Coupon is not found',
      coupon: null
    }
  }

  
}
