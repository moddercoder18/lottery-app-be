import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Document, ObjectId } from "mongoose";
export enum TransactionType {
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  PURCHASED = 'purchased',
  WON = 'won',
  COMMISSION = 'commission'
}
export type CustomerWalletTransactionPublicData = Readonly<{
  _id: ObjectId;
  amount: number;
  customerId: ObjectId;
  lotteryId: ObjectId;
  customerTicketId: ObjectId;
  transactionType: TransactionType;
  isActive: boolean;
  customerCurrency: string;
  isGivenByCash: boolean; // "no"
  cashStatus: string;
  notes: string;
  ticketInformation: any;
}>;

export type CustomerWalletMethods = {
  getPublicData: () => CustomerWalletTransactionPublicData;
};

export type CustomerWalletTransaction = Readonly<{
  _id: ObjectId;
  amount: number;
  customerId: ObjectId;
  lotteryId: ObjectId;
  customerTicketId: ObjectId;
  transactionType: TransactionType;
  isActive: boolean;
  customerCurrency: string;
  isGivenByCash: boolean; // "no"
  cashStatus: string;
  notes: string;
  ticketInformation: any;
}> &
  CustomerWalletMethods &
  Document;

  export class CashRequestApproveRejectDto {
    @ApiProperty({ example: 155 })
    @IsNotEmpty()
    @IsString()
    readonly cashStatus!: string;

    @ApiProperty({ example: 155, required: false })
    @IsOptional()
    @IsString()
    readonly notes!: string;
  }