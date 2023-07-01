import { ApiBody, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";
import { Document, ObjectId } from "mongoose";
import { Interface } from "readline";

export type SettingData = Readonly<{
    _id: ObjectId;
    setting: { serviceFee: number, referralDiscount: number, referralCommission: number, enableCustomerPickNumber: boolean, megaMillionTicketPrice: number, megaMillionMultiplierPrice: number, powerMillionTicketPrice: number, powerMillionMultiplierPrice: number, lotteryAPIKey: string };

}>;

export type SettingMethods = {
    getPublicData: () => SettingData;

};

export type Setting = Readonly<{
    _id: ObjectId;
    setting: { serviceFee: number, referralDiscount: number, referralCommission: number, enableCustomerPickNumber: boolean, megaMillionTicketPrice: number, megaMillionMultiplierPrice: number, powerMillionTicketPrice: number, powerMillionMultiplierPrice: number, lotteryAPIKey: string }
}> &
    SettingMethods &
    Document;

export interface Country {
    value: string;
    label: string;
    currencyCode: string;
    population: string;
    capital: string;
    continentName: string;
}
export class SettingUpdateDto {
    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly serviceFee!: number;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly referralDiscount!: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly lotteryAPIKey!: string;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly referralCommission!: number;

    @ApiProperty({ default: false })
    @IsBoolean()
    @Type(() => Boolean)
    @IsNotEmpty()
    readonly enableCustomerPickNumber!: boolean;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly megaMillionTicketPrice!: number;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly megaMillionMultiplierPrice!: number;


    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly powerMillionTicketPrice!: number;


    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly powerMillionMultiplierPrice!: number;
}

export class SettingDto {
    @ApiProperty()
    @IsObject()
    readonly setting!: SettingUpdateDto;

}
