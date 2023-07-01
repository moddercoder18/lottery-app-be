import { Module } from "@nestjs/common";
import setupSwagger from "./customer-ticket.swagger";
import { CustomerTicketModel } from "./customer-ticket.model";
import { CustomerTicketController } from "./customer-ticket.controller";
import { CustomerTicketService } from "./customer-ticket.service";
import PassportModule from "../common/passport.module";
import { UserModule } from "../user/user.module";
import config from "../config";
import { JwtModule } from "@nestjs/jwt";
import { FileUploadService } from "../common/services/upload.service";
import { LotteryModule } from "../lottery/lottery.module";
import { HttpModule } from "@nestjs/axios";
import { CustomerWalletTransactionModule } from "../customer-wallet-transaction/customer-wallet-transaction.module";
import { SettingModule } from "../setting/setting.module";
import { CustomerMailerService } from "../customer/customer.mailer.service";
import { PageContentModule } from "../page-content/page-content.module";
import { CustomerModule } from "../customer/customer.module";
@Module({
  imports: [
    HttpModule,
    PassportModule,
    UserModule,
    CustomerModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    LotteryModule,
    CustomerWalletTransactionModule,
    SettingModule,
    PageContentModule,
    CustomerTicketModel],
  providers: [CustomerTicketService, FileUploadService],
  controllers: [CustomerTicketController],
  exports: [CustomerTicketService],
})
export class CustomerTicketModule { }

setupSwagger(CustomerTicketModule)


