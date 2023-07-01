import { Module, forwardRef } from "@nestjs/common";
import setupSwagger from "./lottery.swagger";
import { LotteryModel } from "./lottery.model";
import { LotteryController } from "./lottery.controller";
import { LotteryService } from "./lottery.service";
import PassportModule from "../common/passport.module";
import { UserModule } from "../user/user.module";
import config from "../config";
import { JwtModule } from "@nestjs/jwt";
import { FileUploadService } from "../common/services/upload.service";
import { CustomerTicketModule } from "../customer-ticket/customer-ticket.module";
import { CustomerModule } from "../customer/customer.module";
import { PageContentModule } from "../page-content/page-content.module";
import { HttpModule } from "@nestjs/axios";
import { SettingModule } from "../setting/setting.module";

@Module({
  imports: [
    HttpModule,
    PassportModule,
    UserModule,
    CustomerModule,
    PageContentModule,
    SettingModule,
    forwardRef(() => CustomerTicketModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    LotteryModel],
  providers: [LotteryService, FileUploadService],
  controllers: [LotteryController],
  exports: [LotteryService],
})
export class LotteryModule { }

setupSwagger(LotteryModule)


