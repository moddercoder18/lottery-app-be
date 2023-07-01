import { Module } from "@nestjs/common";
import setupSwagger from "./customer-wallet-transaction.swagger";
import { CustomerWalletTransactionModel } from "./customer-wallet-transaction.model";
import { CustomerWalletTransactionController } from "./customer-wallet-transaction.controller";
import { CustomerWalletTransactionService } from "./customer-wallet-transaction.service";
import PassportModule from "../common/passport.module";
import { UserModule } from "../user/user.module";
import config from "../config";
import { JwtModule } from "@nestjs/jwt";
import { CustomerWalletModule } from "../customer-wallet/customer-wallet.module";

@Module({
  imports: [
    PassportModule,
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    CustomerWalletModule,
    CustomerWalletTransactionModel],
  providers: [CustomerWalletTransactionService],
  controllers: [CustomerWalletTransactionController],
  exports: [CustomerWalletTransactionService],
})
export class CustomerWalletTransactionModule { }

setupSwagger(CustomerWalletTransactionModule)


