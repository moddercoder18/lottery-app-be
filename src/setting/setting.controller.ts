import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Body,
  Param,
  Put,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { SettingService } from "./setting.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "../user/user.interface";
import { SettingDto } from "./setting.interface";

@ApiTags("setting")
@Controller("setting")
export class SettingController {
  constructor(private readonly settingService: SettingService) { }


  @Get()
  async getALLData(@Req() req: Request){
     return this.settingService.getAllData()
  }


  @Post("admin")
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiBearerAuth("JWT-auth")
  async updateSetting(
    @Req() req: Request,
    @Body() settingDto: SettingDto,
  ) {
    const user = req.user as User
    return this.settingService.update( settingDto as any, user);
  }
}
