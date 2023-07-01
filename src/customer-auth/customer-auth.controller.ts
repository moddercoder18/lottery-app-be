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
import {AuthGuard} from "@nestjs/passport";
import {Request} from "express";

import {
  ActivateParams,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
  LoginDto,
  CustomerUpdateDto,
  ChangePasswordDto,
} from "./customer-auth.interface";
import {CustomerAuthService} from "./customer-auth.service";
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiTags} from "@nestjs/swagger";
import {Customer} from "../customer/customer.interface";
import {FileInterceptor} from "@nestjs/platform-express";
import {imageFileFilter, multerStorage} from "../common/multer";
@ApiTags("customer-auth")
@Controller("customer")
export class CustomerAuthController {
  constructor(private readonly authService: CustomerAuthService) {}

  @Get("activate/:customerId/:activationToken")
  activate(@Param() params: ActivateParams, @Param("customerId") customerId: string) {
    return this.authService.activate(params);
  }

  @Get("resend-activation-mail/")
  @UseGuards(AuthGuard())
  @ApiBearerAuth("JWT-auth")
  resendActivationMail(@Req() req: Request,) {
    const customer = req.user as Customer
    return this.authService.resendActivationMail(customer);
  }


  @UseGuards(AuthGuard("customer-user"))
  @Post("login")
  login(@Req() req: Request, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user as Customer);
  }

  @Post("signup")
  async signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signUpCustomer(signUpDto);
  }

  @UseGuards(AuthGuard('customer-jwt'))
  @Get("me")
  @ApiBearerAuth("JWT-auth")
  getProfile(@Req() req: Request) {
    const customer = req.user as Customer;
    return this.authService.getCustomerProfile(customer);
  }

  @UseGuards(AuthGuard('customer-jwt'))
  @Get("/:customerId")
  @ApiBearerAuth("JWT-auth")
  getCustomerProfile(@Req() req: Request, @Param("customerId") customerId: string) {
    return this.authService.getCustomerProfileById(customerId as any);
  }
  

  @UseGuards(AuthGuard('customer-jwt'))
  @Get("relogin")
  relogin(@Req() req: Request) {
    return this.authService.login(req.user as Customer);
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
  @UseGuards(AuthGuard('customer-jwt'))
  @ApiBearerAuth("JWT-auth")
  update(@Body() body: CustomerUpdateDto, @Req() req: Request) {
    const customer = req.user as Customer;
    return this.authService.update(customer._id, body);
  }


  @UseGuards(AuthGuard('customer-jwt'))
  @Put("change-password")
  @ApiBearerAuth("JWT-auth")
  changePassword(@Body() body: ChangePasswordDto, @Req() req: Request) {
    const customer = req.user as Customer;
    return this.authService.changePassword(body, customer._id);
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
  @UseGuards(AuthGuard('customer-jwt'))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth("JWT-auth")
  async updateProfilePicture(
    @UploadedFile("file") file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.authService.updatePicture((req.user as Customer)._id, file);
  }

  @Delete("")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  deleteUser(@Req() req: Request) {
    const user = req.user as Customer;
    return this.authService.deleteUser(user?.id);
  }
}
