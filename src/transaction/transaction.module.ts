import { Module } from "@nestjs/common";
import setupSwagger from "./transaction.swagger";
import { TransactionModel } from "./transaction.model";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";
import PassportModule from "../common/passport.module";
import { UserModule } from "../user/user.module";
import config from "../config";
import { JwtModule } from "@nestjs/jwt";
import { FileUploadService } from "../common/services/upload.service";
import { HttpModule } from "@nestjs/axios";
import { CustomerTicketModule } from "../customer-ticket/customer-ticket.module";
import { CustomerModule } from "../customer/customer.module";
import { CurrencyModule } from "../currency/currency.module";
import { LotteryModule } from "../lottery/lottery.module";
import { CouponModule } from "../coupon/coupon.module";
import { SettingModule } from "../setting/setting.module";
import { CustomerWalletTransactionModule } from "../customer-wallet-transaction/customer-wallet-transaction.module";
import { CustomerWalletModule } from "../customer-wallet/customer-wallet.module";

@Module({
  imports: [
    HttpModule,
    PassportModule,
    UserModule,
    LotteryModule,
    CouponModule,
    SettingModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    CustomerModule,
    CustomerTicketModule,
    CustomerWalletModule,
    CustomerWalletTransactionModule,
    TransactionModel],
  providers: [TransactionService, FileUploadService],
  controllers: [TransactionController],
  exports: [TransactionService],
})
export class TransactionModule { }

setupSwagger(TransactionModule)


