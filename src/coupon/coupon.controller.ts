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
import { CouponService } from "./coupon.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";;
import { Customer } from "../customer/customer.interface";

@ApiTags("coupon")
@Controller("coupon")
export class CouponController {
  constructor(private readonly couponService: CouponService) { }

  @Get("validate-coupon/:couponCode")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  getALlCustomerTickets(@Req() req: Request, @Param("couponCode") couponCode: string) {
    const customer = req.user as Customer;
    return this.couponService.findByCode(couponCode, customer._id);
  }

}
