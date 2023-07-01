import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, isNotEmpty, IsOptional, IsString } from "class-validator";
import { Document, ObjectId } from "mongoose";

export type PageContentPublicData = Readonly<{
  _id: ObjectId;
  name: string;
  slug: string;
  content: Record<string, string>;
  subject: Record<string, string>;
  template: string;
  isActive: boolean;
  keywords: { name: string, hint: string }[];
}>;

export type PageContentMethods = {
  getPublicData: () => PageContentPublicData;
};

export type PageContent = Readonly<{
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  slug: string;
  content: Record<string, string>;
  subject: Record<string, string>;
  template: string;
  isActive: boolean;
  keywords: { name: string, hint: string }[];
}> &
  PageContentMethods &
  Document;

export class PageContentDto {
  @ApiProperty({ example: "name" })
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty({ example: "slug" })
  @IsNotEmpty()
  @IsString()
  readonly slug!: string;


  @ApiProperty({ example: "html" })
  @IsNotEmpty()
  @IsString()
  readonly template!: string;

  @ApiProperty({
    example: {
      "en": "",
      "zh": "",
      "ko": ""
    }
  })
  @IsNotEmpty()
  readonly content!: Record<string, string>;

  @ApiProperty({
    required: false, example: {
      "en": "",
      "zh": "",
      "ko": ""
    }
  })
  @IsOptional()
  readonly subject!: Record<string, string>;
}

export class UpdatePageContentDto {
  @ApiProperty({
    example: {
      "en": "",
      "zh": "",
      "ko": ""
    }
  })
  @IsNotEmpty()
  readonly content!: Record<string, string>;


  @ApiProperty({
    required: false, example: {
      "en": "",
      "zh": "",
      "ko": ""
    }
  })
  @IsOptional()
  readonly subject!: Record<string, string>;
}
