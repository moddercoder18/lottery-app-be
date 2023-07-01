import {
  Controller,
  Get,
  Req,
  UseGuards,
  Body,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { TransactionService } from "./transaction.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TransactionCaptureOrderDto, TransactionCreateDto } from "./transaction.interface";
import { Customer } from "../customer/customer.interface";
import config from "../config";
@ApiTags("transaction")
@Controller("transaction")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post("")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  getActiveLotteries(@Req() req: Request, @Body() transactionCreateDto: TransactionCreateDto) {
    const timezone = req.header('timezone') || 'America/Los_Angeles';
    const customer = req.user as Customer
    return this.transactionService.create(customer, transactionCreateDto);
  }

  @Get("paypal-success")
  paypalSuccessEvent(@Req() req: Request, @Query('PayerID') PayerID: string, @Query('paymentId') paymentId: string) {
    return this.transactionService.paypalSuccessEvent(PayerID, paymentId);
  }

  @Post("capture-paypal-order")
  capturePaypalPayment(@Req() req: Request, @Body() transactionCaptureOrderDto: TransactionCaptureOrderDto) {
    return this.transactionService.capturePaypalPayment(transactionCaptureOrderDto.orderId);
  }

  @Get("paypal-cancel")
  paypalCancelEvent(@Req() req: Request, @Query('PayerID') PayerID: string, @Query('paymentId') paymentId: string) {
    return this.transactionService.paypalCancelEvent(req.query);
  }

  @Post("paypal-events")
  paypalEvents(@Req() req: Request, @Body() paypalEventBody: any) {
    return this.transactionService.processPaypalWebhook(paypalEventBody);
  }

  @Post("paypal-page")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  async paypalPage(@Req() req: Request, @Body() transactionCreateDto: TransactionCreateDto) {
    req.header('Authorization')
    const token =req.header('Authorization')?.replace('Bearer ', '') || '';
    const isPaid = await this.transactionService.paymentViaWallet(req.user as Customer, transactionCreateDto);
    return {
      redirect_url : `${config.apiUrl}/payment/paypal.html?transactionCreateDto=${encodeURI(JSON.stringify(transactionCreateDto))}&token=${encodeURI(token)}`,
      isPaid
    }
  }

}
