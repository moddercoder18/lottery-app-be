import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { Document, ObjectId } from "mongoose";
import { CreateCustomerTicketDto } from "../customer-ticket/customer-ticket.interface";

export enum UserPaymentType {
  ONE_TIME_ENTRY = 'one-time-entry',
  MULTI_DRAW = 'multi-draw',
  SUBSCRIPTION = 'subscription'
}

export enum PaymentType {
  PAYPAL = 'paypal',
  WALLET = 'wallet',
  PAYPAL_WITH_WALLET = 'paypal_wallet'
}
export type TransactionPublicData = Readonly<{
  customerId: ObjectId;
  customerTicketId: ObjectId;
  lotteryId: ObjectId;
  isActive: boolean;
  paymentType: PaymentType;
  type: UserPaymentType;
  status: string;
  amountInCustomerCurrency: number | string;
  amount: number | string;
  response: any;
  orderId: string;
  multiDrawSelectedOption: number;
  discount: number | string;
  serviceFee: number | string;
  subTotalTicketPrice: number | string;
  couponId: ObjectId;
  byWallet: number;
  walletTransactionId: ObjectId;
}>;

export type TransactionMethods = {
  getPublicData: () => TransactionPublicData;
};

export type Transaction = Readonly<{
  customerId: ObjectId;
  customerTicketId: ObjectId;
  lotteryId: ObjectId;
  isActive: boolean;
  paymentType: PaymentType;
  type: UserPaymentType;
  status: string;
  amountInCustomerCurrency: number | string;
  amount: number | string;
  response: any;
  orderId: string;
  multiDrawSelectedOption: number;
  discount: number | string;
  serviceFee: number | string;
  subTotalTicketPrice: number | string;
  couponId: ObjectId;
  byWallet: number;
  walletTransactionId: ObjectId;
}> &
  TransactionMethods &
  Document;


export class TransactionCreateDto {
  @ApiProperty({
    example: {
      "lotteryId": "uuid",
      "tickets": [
        {
          "numbers": [
            1,
            2,
            3,
            4,
            5
          ],
          "powerNumbers": [
            1,
            2
          ]
        }
      ],
      "type": "normal",
      "systematicNumber": {
        "numbers": [
          1,
          2,
          3,
          4,
          5
        ],
        "powerNumbers": [
          1,
          2
        ]
      }
    }
  })
  @IsNotEmpty()
  @IsObject()
  readonly customerTicket!: CreateCustomerTicketDto;

  @ApiProperty({ example: UserPaymentType.ONE_TIME_ENTRY })
  @IsString()
  readonly type!: UserPaymentType;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  readonly multiDrawSelectedOption!:  5 | 10 | 15 | 25 | 52;

  @ApiProperty({ example: "KRW", required: false })
  @IsOptional()
  @IsString()
  readonly customerCurrency!: string;

  @ApiProperty({ example: "ABCDEF", required: false })
  @IsOptional()
  @IsString()
  readonly couponCode!: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  readonly hasWallet!: string;
}

export class TransactionCaptureOrderDto {
  @ApiProperty({
    example: '12345'
  })
  @IsString()
  readonly orderId!: string;
}

export const MultiDrawOptions = {
  5: {
    off: 15
  },
  10: {
    off: 20
  },
  15: {
    off: 21.5
  },
  25: {
    off: 22.5
  },
  52: {
    off: 25
  }
}
