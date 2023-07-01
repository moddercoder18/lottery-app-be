import { Module } from "@nestjs/common";
import setupSwagger from "./setting.swagger";
import { SettingModel } from "./setting.model";
import { SettingController } from "./setting.controller";
import { SettingService } from "./setting.service";
import PassportModule from "../common/passport.module";
import { UserModule } from "../user/user.module";
import { CurrencyModule } from "../currency/currency.module";
import config from "../config";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    PassportModule,
    UserModule,
    CurrencyModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    SettingModel],
  providers: [ SettingService],
  controllers: [SettingController],
  exports: [SettingService],
})
export class SettingModule { }

setupSwagger(SettingModule);



