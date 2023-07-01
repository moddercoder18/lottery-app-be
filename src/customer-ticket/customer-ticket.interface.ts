import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { Document, ObjectId } from "mongoose";
import { LotteryType } from "../lottery/lottery.interface";

export type CustomerTicketPublicData = Readonly<{
  _id: ObjectId;
  customerId: ObjectId;
  tickets: [
    {
      numbers: number[], powerNumbers: number[], isWinner: boolean,
      matchedNumbers: number[];
      matchedPowerNumbers: number[];
      priceBreakdown: { number: number, powerNumber: number, price: number },
      lineIndex: number;
    }
  ];
  lotteryId: ObjectId;
  agentId: ObjectId;
  agentScanTicket: string[];
  agentTickets: [{ numbers: number[], powerNumbers: number[] }];
  isWinner: boolean;
  isActive: boolean;
  status: string;
  transactionId: ObjectId;
  type: string;
  systematicNumber: { numbers: number[], powerNumbers: number[] };
  hasMultiplier: boolean;
}>;

export type CustomerTicketMethods = {
  getPublicData: () => CustomerTicketPublicData;
};

export type CustomerTicket = Readonly<{
  _id: ObjectId;
  customerId: ObjectId;
  tickets: [{ numbers: number[], powerNumbers: number[], isWinner: boolean, matchedNumbers: number[];
    matchedPowerNumbers: number[];
    priceBreakdown: { number: number, powerNumber: number, price: number },
    lineIndex: number; walletTransactionId: ObjectId }];
  lotteryId: ObjectId;
  agentId: ObjectId;
  agentScanTicket: string[];
  agentTickets: [{ numbers: number[], powerNumbers: number[] }];
  isWinner: boolean;
  isActive: boolean;
  status: string; // "draft", "purchased", "assigned", "purchased-original-ticket" "completed"
  transactionId: ObjectId;
  type: string;
  systematicNumber: { numbers: number[], powerNumbers: number[] };
  hasMultiplier: boolean;
  enableCustomerPickNumber: boolean;
  isVerified: boolean;

}> &
  CustomerTicketMethods &
  Document;

export class Ticket {
  @ApiProperty({ example: 155 })
  @IsArray()
  @Type(() => Number)
  @IsNotEmpty()
  readonly numbers!: number[];

  @ApiProperty({ example: 155 })
  @IsArray()
  @Type(() => Number)
  @IsNotEmpty()
  readonly powerNumbers!: number[];
}

export class SystematicNumberObject {
  @ApiProperty({ example: 155 })
  @IsArray()
  @Type(() => Number)
  @IsNotEmpty()

  readonly numbers!: number[];

  @ApiProperty({ example: 155 })
  @IsArray()
  @Type(() => Number)
  @IsNotEmpty()
  readonly powerNumbers!: number[];
}

export class AgentTicket {
  @ApiProperty({ example: 155 })
  @IsArray()
  @Type(() => Number)
  @IsNotEmpty()

  readonly numbers!: number[];

  @ApiProperty({ example: 155 })
  @IsArray()
  @Type(() => Number)
  @IsNotEmpty()
  readonly powerNumbers!: number[];
}


export class CreateCustomerTicketDto {

  @ApiProperty({ example: "uuid" })
  @IsNotEmpty()
  @IsString()
  readonly lotteryId!: ObjectId;

  @ApiProperty({
    example: [{
      numbers: [1, 2, 3, 4, 5],
      powerNumbers: [1, 2]
    }],
  })
  @IsArray()
  @Type(() => Ticket)
  readonly tickets!: Ticket[];

  @ApiProperty({ example: "normal", })
  @IsOptional()
  @IsString()
  readonly type!: string;

  @ApiProperty({
    example: {
      numbers: [1, 2, 3, 4, 5],
      powerNumbers: [1, 2]
    },
  })
  @IsObject()
  @IsOptional()
  @Type(() => SystematicNumberObject)
  readonly systematicNumber!: SystematicNumberObject;

  @ApiProperty({ example: false })
  @IsNotEmpty()
  @IsBoolean()
  readonly hasMultiplier!: boolean;

}
export class AgentCustomerTicketDto {

  @ApiProperty({ example: "uuid" })
  @IsNotEmpty()
  @IsString()
  readonly lotteryId!: ObjectId;

  @ApiProperty({
    example: [{
      numbers: [1, 2, 3, 4, 5],
      powerNumbers: [1, 2]
    }],
  })
  @IsArray()
  @Type(() => Ticket)
  readonly agentTickets!: Ticket[];
}


export class AgentTicketDto {
  @ApiProperty({ example: "uuid" })
  @IsNotEmpty()
  @IsString()
  readonly customerTicketId!: ObjectId;

  @ApiProperty({ example: "uuid" })
  @IsNotEmpty()
  @IsString()
  readonly agentId!: ObjectId;
}


export class AdminCustomerTicketFilterDto {

  @ApiProperty({ example: "uuid", required: false })
  @IsOptional()
  @IsString()
  readonly status!: string;


  @ApiProperty({ example: "uuid", required: false })
  @IsOptional()
  @IsString()
  readonly lotteryType!: LotteryType;

  @ApiProperty({ example: "uuid", required: false })
  @IsOptional()
  @IsString()
  readonly agentId!: ObjectId;

  @ApiProperty({ example: "uuid", required: false })
  @IsOptional()
  readonly startDate!: Date;

  @ApiProperty({ example: "uuid", required: false })
  @IsOptional()
  readonly endDate!: Date;
}