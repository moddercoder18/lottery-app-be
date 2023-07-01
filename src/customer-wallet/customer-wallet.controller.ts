import {
  Controller,
  Get,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { CustomerWalletService } from "./customer-wallet.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Customer } from "../customer/customer.interface";

@ApiTags("customer-wallet")
@Controller("customer-wallet")
export class CustomerWalletController {
  constructor(private readonly customerWalletService: CustomerWalletService) { }

  @Get("")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  findCustomerWallet(@Req() req: Request) {
    const user = req.user as Customer;
    return this.customerWalletService.findCustomerWallet(user?._id);
  }

  @Get("admin")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  findCustomerWallets(@Req() req: Request) {
    const user = req.user as Customer;
    return this.customerWalletService.findCustomerWallets();
  }

}
