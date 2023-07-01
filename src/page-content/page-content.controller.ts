import {
  Controller,
  Get,
  Post,
  Req,
  Put,
  UseGuards,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UploadedFiles
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { PageContentService } from "./page-content.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "../user/user.interface";
import { PageContentDto, UpdatePageContentDto } from "./page-content.interface";
import { excelFileFilter, imageFileFilter, multerStorage } from "../common/multer";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ObjectId } from 'mongoose'
import { Customer } from "../customer/customer.interface";
@ApiTags("page-content")
@Controller("page-content")
export class PageContentController {
  constructor(private readonly pageContentService: PageContentService) { }

  @Get(":slug")
  getPageContentBySlug(@Param('slug') slug: string, @Req() req: Request) {
    return this.pageContentService.findBySlug(slug);
  }

  @Get("")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  getAllPageContent(@Req() req: Request) {
    const user = req.user as User;
    return this.pageContentService.find();
  }

  @Post("")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  addPageContent(@Req() req: Request, @Body() pageContentDto: PageContentDto) {
    const user = req.user as User;
    return this.pageContentService.create(
      user,
      pageContentDto as any);
  }

  @Put(":id")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  async updatePageContent(@Req() req: Request, @Body() pageContentDto: UpdatePageContentDto, @Param('id') id: string) {
    const user = req.user as User;
    return this.pageContentService.update(
      user,
      pageContentDto as any,
      id
      );
  }

  @Delete(":id")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  deletePageContent(@Param('id') id: string, @Req() req: Request ) {
    return this.pageContentService.delete(id);
  }

}
