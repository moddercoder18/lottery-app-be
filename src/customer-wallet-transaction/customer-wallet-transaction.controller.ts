import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { CustomerWalletTransactionService } from "./customer-wallet-transaction.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Customer } from "../customer/customer.interface";
import { CashRequestApproveRejectDto } from "./customer-wallet-transaction.interface";
import { FilesInterceptor } from "@nestjs/platform-express";
import { multerStorage } from "../common/multer";
import { ObjectId } from "mongoose";

@ApiTags("customer-wallet-transaction")
@Controller("customer-wallet-transaction")
export class CustomerWalletTransactionController {
  constructor(private readonly customerWalletTransactionService: CustomerWalletTransactionService) { }

  @Get("")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  findCustomerWalletTransactions(@Req() req: Request) {
    const user = req.user as Customer;
    return this.customerWalletTransactionService.findCustomerWalletTransactions(user?._id);
  }

  @Get("admin/:id")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  findCustomerWallets(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as Customer;
    return this.customerWalletTransactionService.findCustomerWalletTransactions(id);
  }

  @Get("cash-requests")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  cashRequests(@Req() req: Request) {
    const user = req.user as Customer;
    return this.customerWalletTransactionService.findCustomerCashRequests();
  }

  @Put("cash-requests/:id")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        }
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("file", 50, {
      storage: multerStorage,
    }),
  )
  @ApiConsumes("multipart/form-data")
  cashRequestApproveReject(@Req() req: Request, @Param('id') id: string,  @Body() cashRequestApproveRejectDto: CashRequestApproveRejectDto) {
    const user = req.user as Customer;
    return this.customerWalletTransactionService.updateCustomerCashRequestById(id as unknown as ObjectId, cashRequestApproveRejectDto);
  }

}
