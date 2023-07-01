import { Module } from "@nestjs/common";
import setupSwagger from "./customer-wallet.swagger";
import { CustomerWalletModel } from "./customer-wallet.model";
import { CustomerWalletController } from "./customer-wallet.controller";
import { CustomerWalletService } from "./customer-wallet.service";
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
    CustomerWalletModel],
  providers: [CustomerWalletService],
  controllers: [CustomerWalletController],
  exports: [CustomerWalletService],
})
export class CustomerWalletModule { }

setupSwagger(CustomerWalletModule)


