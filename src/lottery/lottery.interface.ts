import { Document, ObjectId } from "mongoose";
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsNumber,
    IsBoolean,
    IsDate,
    IsArray,
    IsObject,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
export enum LotteryType {
    MegaMillions = 'MegaMillions',
    PowerBall = 'PowerBall'
}

export type LotteryPublicData = Readonly<{
    _id: ObjectId;
    userId: ObjectId;
    isActive: boolean;
    name: string;
    image: string;
    description: string;
    winningPrice: number;
    type: LotteryType;
    startDate: Date;
    endDate: Date;
    numbersPerLine: { totalShowNumber: number, totalShowPowerNumber: number, maxSelectTotalNumber: number, maxSelectTotalPowerNumber: number };
    winningNumbers: { numbers: number[], powerNumbers: number[] };
    ticketPricePerLine: number;
    multiplierPricePerLine: number;
    priceCurrency: string;
    markAsComplete: boolean;
    markAsPublish: boolean;
    prizeBreakDown: { number: number, powerNumber: number, price: number }[];
    timeZone: string;
    hasMultiDraw: boolean;
    MultiDrawOptions: string;
    multiplier: number;
    backgroundColor: string;
}>;
export type LotteryMethods = {
    getPublicData: () => LotteryPublicData;
};

export type Lottery = Readonly<{
    _id: ObjectId;
    userId: ObjectId;
    isActive: boolean;
    name: string;
    image: string;
    description: string;
    winningPrice: number;
    type: LotteryType;
    startDate: Date;
    endDate: Date;
    numbersPerLine: { totalShowNumber: number, totalShowPowerNumber: number, maxSelectTotalNumber: number, maxSelectTotalPowerNumber: number };
    winningNumbers: { numbers: number[], powerNumbers: number[] };
    ticketPricePerLine: number;
    multiplierPricePerLine: number;
    priceCurrency: string;
    markAsComplete: boolean;
    markAsPublish: boolean;
    prizeBreakDown: { number: number, powerNumber: number, price: number }[];
    timeZone: string;
    hasMultiDraw: boolean;
    multiDrawOptions: { value: string, label: string }[];
    multiplier: number
    ticketLines: number
    backgroundColor: string;
}> &
    LotteryMethods &
    Document;


export class NumbersPerLineLottery {
    @ApiProperty({ example: 150 })
    @IsNumber()
    @IsNotEmpty()
    readonly totalShowNumber!: number;

    @ApiProperty({ example: 150 })
    @IsNumber()
    @IsNotEmpty()
    readonly totalShowPowerNumber!: number;

    @ApiProperty({ example: 150 })
    @IsNumber()
    @IsNotEmpty()
    readonly maxSelectTotalNumber!: number;

    @ApiProperty({ example: 150 })
    @IsNumber()
    @IsNotEmpty()
    readonly maxSelectTotalPowerNumber!: number;
}

export class winningNumbersLottery {
    @ApiProperty({ example: 155 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly numbers!: number[];

    @ApiProperty({ example: 155 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly powerNumbers!: number[];
}


export class MultiDrawOptionsLottery {
    @ApiProperty({ example: "US Million" })
    @IsString()
    @IsNotEmpty()
    readonly value!: string;

    @ApiProperty({ example: 155 })
    @IsNumber()
    @Type(() => String)
    @IsNotEmpty()
    readonly label!: string;

}

export class PrizeBreakDown {
    @ApiProperty({ example: 5 })
    @IsNumber()
    @IsNotEmpty()
    readonly number!: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    readonly powerNumber!: number;

    @ApiProperty({ example: 1000000 })
    @IsNumber()
    @IsNotEmpty()
    readonly price!: number;
}
export class LotteryDto {

    @ApiProperty({ example: "US Million" })
    @IsString()
    @IsOptional()
    readonly name!: string;

    @ApiProperty({ example: "Let's play US Million Lottery" })
    @IsString()
    @IsOptional()
    readonly description!: string;

    @ApiProperty({ example: 155 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly winningPrice!: number;

    @ApiProperty({ example: 10 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly ticketLines!: number;

    @ApiProperty({ example: "type of lottery" })
    @IsString()
    @IsNotEmpty()
    readonly type!: string;


    @ApiProperty({ example: "yy-mm-dd" })
    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    readonly startDate!: Date;

    @ApiProperty({ example: "yy-mm-dd" })
    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    readonly endDate!: Date;

    @ApiProperty({
        example: {
            totalShowNumber: "50",
            totalShowPowerNumber: "20",
            maxSelectTotalNumber: "5",
            maxSelectTotalPowerNumber: "2",
        },
    })
    @IsObject()
    readonly numbersPerLine!: NumbersPerLineLottery;;



    @ApiProperty({ example: 155 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly ticketPricePerLine!: number;

    @ApiProperty({ example: 155 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly multiplierPricePerLine!: number;

    @ApiProperty({ example: '$' })
    @IsOptional()
    @IsString()
    @Type(() => String)
    readonly priceCurrency!: string;

    @ApiProperty({ example: "12.00.00" })
    @IsOptional()
    @IsString()
    @Type(() => String)
    readonly timeZone!: string;


    @ApiProperty({ example: false })
    @IsBoolean()
    @Type(() => Boolean)
    @IsNotEmpty()
    readonly hasMultiDraw!: boolean;

    @ApiProperty({ example: false })
    @IsBoolean()
    @Type(() => Boolean)
    @IsNotEmpty()
    readonly markAsPublish!: boolean;

    @ApiProperty({ example: [{ label: '', value: '' }] })
    @IsArray()
    @Type(() => MultiDrawOptionsLottery)
    readonly multiDrawOptions!: MultiDrawOptionsLottery[];

    @ApiProperty({ example: 155 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    readonly multiplier!: number;

    @ApiProperty({ example: "color" })
    @IsString()
    @IsOptional()
    readonly backgroundColor!: string;

    @ApiProperty({
        example: [{
            numbers: [1, 2, 3, 4, 5],
            powerNumbers: [1, 2]
        }],
    })
    @IsOptional()
    @IsArray()
    @Type(() => PrizeBreakDown)
    readonly prizeBreakDown!: PrizeBreakDown[];
}

export class SetWiningNumberDto {
    @ApiProperty({
        example: {
            numbers: [1, 2, 3, 4, 5],
            powerNumbers: [1, 2],
        },
    })
    @IsObject()
    readonly winningNumbers!: winningNumbersLottery;
}




export class AdminLotteryFilterDto {
    @ApiProperty({ example: "uuid", required: false })
    @IsOptional()
    @IsString()
    readonly type!: LotteryType;

    @ApiProperty({ example: "uuid", required: false })
    @IsOptional()
    // @IsDate()
    readonly startDate!: Date;

    @ApiProperty({ example: "uuid", required: false })
    @IsOptional()
    // @IsDate()
    readonly endDate!: Date;
}

export class HistoryLotteryFilterDto {
    @ApiProperty({ example: "uuid", required: false })
    @IsOptional()
    // @IsDate()
    readonly currentDate!: Date;

    @ApiProperty({ example: "uuid", required: false })
    @IsOptional()
    // @IsDate()
    readonly endDate!: Date;
}


export const PowerBallLotteryStatic = {
    name: 'U.S. - Powerball',
    description: 'U.S. - Powerball',
    image: 'https://lottery-app-2023.s3.us-east-2.amazonaws.com/pb.png',
    multiplier: 3,
    ticketPrice: 5,
    multiplierPrice: 2.5,
    backgroundColor: '#d92643',
    prizeBreakDown: [
        {
            "number": 5,
            "powerNumber": 1,
            "price": '{{JACK_POT}}'
        },
        {
            "number": 5,
            "powerNumber": 0,
            "price": 1000000
        },
        {
            "number": 4,
            "powerNumber": 1,
            "price": 50000
        },
        {
            "number": 4,
            "powerNumber": 0,
            "price": 100
        },
        {
            "number": 3,
            "powerNumber": 1,
            "price": 100
        },
        {
            "number": 2,
            "powerNumber": 0,
            "price": 7
        },
        {
            "number": 2,
            "powerNumber": 1,
            "price": 7
        },
        {
            "number": 1,
            "powerNumber": 1,
            "price": 4
        }
    ],
    numbersPerLine: { totalShowNumber: 69, totalShowPowerNumber: 26, maxSelectTotalNumber: 5, maxSelectTotalPowerNumber: 1 },
    timeZone: 'America/Los_Angeles',
    ticketLines: 800,
}

export const MegaMillionsLotteryStatic = {
    name: 'U.S. - Mega Millions',
    description: 'U.S. - Mega Millions',
    image: 'https://lottery-app-2023.s3.us-east-2.amazonaws.com/mg.png',
    multiplier: 3,
    ticketPrice: 5,
    multiplierPrice: 2.5,
    backgroundColor: '#3879da',
    prizeBreakDown: [
        {
            "number": 5,
            "powerNumber": 1,
            "price": '{{JACK_POT}}'
        },
        {
            "number": 5,
            "powerNumber": 0,
            "price": 1000000
        },
        {
            "number": 4,
            "powerNumber": 1,
            "price": 10000
        },
        {
            "number": 4,
            "powerNumber": 0,
            "price": 500
        },
        {
            "number": 3,
            "powerNumber": 1,
            "price": 200
        },
        {
            "number": 2,
            "powerNumber": 0,
            "price": 10
        },
        {
            "number": 2,
            "powerNumber": 1,
            "price": 10
        },
        {
            "number": 1,
            "powerNumber": 1,
            "price": 4
        },
        {
            "number": 0,
            "powerNumber": 1,
            "price": 2
        }
    ],
    numbersPerLine: { totalShowNumber: 70, totalShowPowerNumber: 25, maxSelectTotalNumber: 5, maxSelectTotalPowerNumber: 1 },
    timeZone: 'America/Los_Angeles',
    ticketLines: 800,
}