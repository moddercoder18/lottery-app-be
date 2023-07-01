import { Module } from "@nestjs/common";
import setupSwagger from "./coupon.swagger";
import { CouponModel, UsedCouponModel } from "./coupon.model";
import { CouponController } from "./coupon.controller";
import { CouponService } from "./coupon.service";
import PassportModule from "../common/passport.module";
import { UserModule } from "../user/user.module";
import config from "../config";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    PassportModule,
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    CouponModel, UsedCouponModel ],
  providers: [ CouponService],
  controllers: [CouponController],
  exports: [CouponService],
})
export class CouponModule { }

setupSwagger(CouponModule);



