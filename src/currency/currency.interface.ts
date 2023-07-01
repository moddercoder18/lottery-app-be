import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString } from "class-validator";
import { Document, ObjectId } from "mongoose";

export type CurrencyPublicData = Readonly<{
  _id: ObjectId;
  baseCurrency: string;
  date: Date;
  rates: {
    [currency: string]: number
  };
  isActive: boolean;
}>;

export type CurrencyMethods = {
  getPublicData: () => CurrencyPublicData;
};

export type Currency = Readonly<{
  _id: ObjectId;
  baseCurrency: string;
  date: Date;
  rates: {
    [currency: string]: number
  };
  isActive: boolean;
}> &
  CurrencyMethods &
  Document;


export class CurrencyConverterDto {
  @ApiProperty({ example: "USD" })
  @IsString()
  readonly baseCurrency!: string;

  @ApiProperty({ example: [
    "KRW",
    "CNY",
    "INR",
    "USD",
    "JPY",
    "PHP",
    "VND",
    "MYR",
    "IDR"
]})
  @IsArray()
  @Type(() => String)
  @IsNotEmpty()
  readonly targetCurrencies!: string[];
}


