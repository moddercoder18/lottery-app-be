import {
  Controller,
  Get,
  Post,
  Req,
  Param,
  UseGuards,
  Body,
  Put,
  UseInterceptors,
  UploadedFile,
  Query,
  Delete,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";

import {
  ActivateParams,
  ForgottenPasswordDto,
  ResetPasswordDto,
  LoginDto,
  UserUpdateDto,
  ChangePasswordDto,
  CreateUserDto,
} from "./user-auth.interface";
import { UserAuthService } from "./user-auth.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { User } from "../user/user.interface";
import { FileInterceptor } from "@nestjs/platform-express";
import { imageFileFilter, multerStorage } from "../common/multer";
import { ObjectId } from "mongoose";
@ApiTags("user-auth")
@Controller("user")
export class UserAuthController {
  constructor(private readonly authService: UserAuthService) { }

  @Get("activate/:userId/:activationToken")
  activate(@Param() params: ActivateParams, @Param("userId") userId: string) {
    return this.authService.activate(params);
  }

  @UseGuards(AuthGuard("admin-user"))
  @Post("login")
  login(@Req() req: Request, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user as User);
  }

  @Post("")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phoneNo: { type: 'string' },
        password: { type: 'string' },
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multerStorage,
      fileFilter: imageFileFilter,
    }),
  )
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth("JWT-auth")
  async create(@Req() req: Request, @Body() createUser: CreateUserDto, @UploadedFile("file") file: Express.Multer.File,) {
    const user = req.user as User
    return this.authService.createUser(user, createUser, file);
  }

  @UseGuards(AuthGuard("admin-jwt"))
  @Get("me")
  @ApiBearerAuth("JWT-auth")
  getProfile(@Req() req: Request) {
    const user = req.user as User;
    return this.authService.getUserProfile(user);
  }


  @UseGuards(AuthGuard("admin-jwt"))
  @Get("relogin")
  relogin(@Req() req: Request) {
    return this.authService.login(req.user as User);
  }

  @Get("")
  @UseGuards(AuthGuard("admin-jwt"))
  findAllUsers(
    @Req() req: Request
  ) {
    return this.authService.findAllUsers(req.user as User)
  }

  @Get("field-agent")
  @UseGuards(AuthGuard("admin-jwt"))
  fieldAgent(
    @Req() req: Request
  ) {
    return this.authService.findFieldAgents(req.user as User)
  }

  

  @Post("forgotten-password")
  forgottenPassword(@Body() body: ForgottenPasswordDto) {
    return this.authService.forgottenPassword(body);
  }

  @Post("reset-password")
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }


  @Put("")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  update(@Body() body: UserUpdateDto, @Req() req: Request) {
    const user = req.user as User;
    return this.authService.update(user._id, body);
  }


  @UseGuards(AuthGuard("admin-jwt"))
  @Put("change-password")
  @ApiBearerAuth("JWT-auth")
  changePassword(@Body() body: ChangePasswordDto, @Req() req: Request) {
    const user = req.user as User;
    return this.authService.changePassword(body, user._id,);
  }


  @Put("profile-picture")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multerStorage,
      fileFilter: imageFileFilter,
    }),
  )
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth("JWT-auth")
  async updateProfilePicture(
    @UploadedFile("file") file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.authService.updatePicture((req.user as User)._id, file);
  }


  @Put(":id")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phoneNo: { type: 'string' },
        password: { type: 'string' },
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multerStorage,
      fileFilter: imageFileFilter,
    }),
  )
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth("JWT-auth")
  async updateUser(@Body() body: UserUpdateDto,
    @UploadedFile("file") file: Express.Multer.File,
    @Req() req: Request,
    @Param('id') id: string
  ) {
    const user = req.user as User;
    return this.authService.updateUserById(body, id, file);
  }

  @UseGuards(AuthGuard("admin-jwt"))
  @Get("/:userId")
  @ApiBearerAuth("JWT-auth")
  getUserProfile(@Req() req: Request, @Param("userId") userId: string) {
    return this.authService.getUserProfileById(userId as any);
  }



  @Delete(":id")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  deleteUser(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.authService.deleteUser(id, user);
  }

}
