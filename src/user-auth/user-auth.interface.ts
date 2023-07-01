import {
  IsEmail,
  MinLength,
  MaxLength,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { UserType } from "../user/user.interface";

// TODO add mixins like EmailField, PasswordField

export class ActivateParams {
  @ApiProperty({ type: "ObjectID" })
  @IsNotEmpty()
  readonly userId!: string;

  @ApiProperty({ type: "uuid" })
  @IsUUID()
  readonly activationToken!: string;
}

export class CreateUserDto {
  @ApiProperty({ example: "superadmin@yopmail.com", maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ example: "123456789", minLength: 8 })
  @MinLength(8)
  @IsNotEmpty()
  readonly password!: string;

  @ApiProperty({ example: "name", minLength: 2 })
  @MinLength(2)
  readonly name!: string;

  @ApiProperty({ example: "+918934757575" })
  @IsOptional()
  readonly phoneNo!: string;

  @ApiProperty({ example: "email" })
  @IsOptional()
  readonly provider!: string;


  @ApiProperty({ example: "email" })
  @IsOptional()
  readonly type!: UserType;

  @ApiProperty({ example: "link" })
  @IsOptional()
  readonly profilePicture!: string;
}

export class UserUpdateDto {
  @ApiProperty({ example: "user@yopmail.com", maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ example: "name", minLength: 2 })
  @MinLength(2)
  readonly name!: string;

  @ApiProperty({ example: "+918934757575" })
  @IsOptional()
  readonly phoneNo!: string;

  @ApiProperty({ example: "123456789", minLength: 8 })
  @IsOptional()
  readonly password!: string;

  @ApiProperty({ example: "admin" })
  @IsOptional()
  readonly type!: string;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  readonly maxAssignedTicket!: number;
}

export class LoginDto {
  @ApiProperty({ example: "user@yopmail.com", maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ example: "123456789", minLength: 8 })
  @MinLength(8)
  readonly password!: string;
}

export class ForgottenPasswordDto {
  @ApiProperty({ example: "user@yopmail.com", maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ type: "uuid" })
  @IsUUID()
  readonly passwordResetToken!: string;

  @ApiProperty({ example: "password", minLength: 8 })
  @MinLength(8)
  readonly password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: "password" })
  @IsNotEmpty()
  @IsString()
  readonly oldPassword!: string;


  @ApiProperty({ example: "newPassword", minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  readonly newPassword!: string;
}