import { Module } from "@nestjs/common";
import setupSwagger from "./page-content.swagger";
import { PageContentModel } from "./page-content.model";
import { PageContentController } from "./page-content.controller";
import { PageContentService } from "./page-content.service";
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
    PageContentModel],
  providers: [PageContentService],
  controllers: [PageContentController],
  exports: [PageContentService],
})
export class PageContentModule { }

setupSwagger(PageContentModule)


