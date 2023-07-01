import { ApiBody, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";
import { Document, ObjectId } from "mongoose";
import { Interface } from "readline";

export type CouponData = Readonly<{
    _id: ObjectId;
    customerId: ObjectId;
    code: string;
    isActive: boolean

}>;

export type CouponMethods = {
    getPublicData: () => CouponData;

};

export type Coupon = Readonly<{
    _id: ObjectId;
    customerId: ObjectId;
    code: string;
    isActive: boolean
}> &
    CouponMethods &
    Document;

    export type UsedCouponData = Readonly<{
        _id: ObjectId;
        customerId: ObjectId;
        couponId: ObjectId;
        isActive: boolean
    
    }>;
    
    export type UsedCouponMethods = {
        getPublicData: () => UsedCouponData;
    
    };
    
    export type UsedCoupon = Readonly<{
        _id: ObjectId;
        customerId: ObjectId;
        couponId: ObjectId;
        isActive: boolean
    }> &
        UsedCouponMethods &
        Document;


export class CouponDto {
    // @ApiProperty()
    // @IsObject()
    // readonly setting!: SettingUpdateDto;

}
