import {Module} from "@nestjs/common";
import {JwtModule} from "@nestjs/jwt";

import config from "../config";
import {CustomerModule} from "../customer/customer.module";
import {CouponModule} from "../coupon/coupon.module";
import PassportModule from "../common/passport.module";

import {CustomerAuthService} from "./customer-auth.service";
import {LocalStrategy} from "./local.strategy";
import {JwtStrategy} from "./jwt.strategy";
import {CustomerAuthController} from "./customer-auth.controller";
import setupSwagger from "./customer-auth.swagger";
import { FileUploadService } from "../common/services/upload.service";
import { CustomerWalletModule } from "../customer-wallet/customer-wallet.module";

@Module({
  imports: [
    PassportModule,
    CustomerModule,
    CouponModule,
    CustomerWalletModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {expiresIn: config.auth.jwtTokenExpireInSec},
    }),
  ],
  providers: [CustomerAuthService, LocalStrategy, JwtStrategy, FileUploadService],
  controllers: [CustomerAuthController],
  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}

setupSwagger(CustomerAuthModule);
