import {
  IsEmail,
  MinLength,
  MaxLength,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class ActivateParams {
  @ApiProperty({type: "ObjectID"})
  @IsNotEmpty()
  readonly customerId!: string;

  @ApiProperty({type: "uuid"})
  @IsUUID()
  readonly activationToken!: string;
}

export class SignUpDto {
  @ApiProperty({example: "customer@yopmail.com", maxLength: 255})
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({example: "123456789", minLength: 8})
  @MinLength(8)
  readonly password!: string;

  @ApiProperty({example: "name", minLength: 2})
  @MinLength(2)
  readonly name!: string;

  @ApiProperty({example: "email"})
  @IsOptional()
  readonly country!: string;

  @ApiProperty({example: "+918934757575"})
  @IsOptional()
  readonly phoneNo!: string;

  @ApiProperty({example: "email"})
  @IsOptional()
  readonly provider!: string;

  @ApiProperty({example: "link"})
  @IsOptional()
  readonly profilePicture!: string;

  @ApiProperty({example: "en", required: false })
  @IsOptional()
  readonly language!: string;
}

export class CustomerUpdateDto {
  @ApiProperty({example: "customer@yopmail.com", maxLength: 255})
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({example: "name", minLength: 2})
  @MinLength(2)
  readonly name!: string;

  @ApiProperty({example: "+918934757575"})
  @IsOptional()
  readonly phoneNo!: string;

  @ApiProperty({example: "en", required: false })
  @IsOptional()
  readonly language!: string;
}

export class LoginDto {
  @ApiProperty({example: "customer@yopmail.com", maxLength: 255})
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({example: "123456789", minLength: 8})
  @MinLength(8)
  readonly password!: string;
}

export class ForgottenPasswordDto {
  @ApiProperty({example: "customer@yopmail.com", maxLength: 255})
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({type: "uuid"})
  @IsUUID()
  readonly passwordResetToken!: string;

  @ApiProperty({example: "password", minLength: 8})
  @MinLength(8)
  readonly password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({example: "password"})
  @IsNotEmpty()
  @IsString()
  readonly oldPassword!: string;


  @ApiProperty({example: "newPassword", minLength: 8})
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  readonly newPassword!: string;
}