import {Module} from "@nestjs/common";
import {JwtModule} from "@nestjs/jwt";

import config from "../config";
import {UserModule} from "../user/user.module";
import PassportModule from "../common/passport.module";

import {UserAuthService} from "./user-auth.service";
import {LocalStrategy} from "./local.strategy";
import {JwtStrategy} from "./jwt.strategy";
import {UserAuthController} from "./user-auth.controller";
import setupSwagger from "./user-auth.swagger";
import { FileUploadService } from "../common/services/upload.service";

@Module({
  imports: [
    PassportModule,
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {expiresIn: config.auth.jwtTokenExpireInSec},
    }),
  ],
  providers: [UserAuthService, LocalStrategy, JwtStrategy, FileUploadService],
  controllers: [UserAuthController],
  exports: [UserAuthService],
})
export class UserAuthModule {}

setupSwagger(UserAuthModule);
