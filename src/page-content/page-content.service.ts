import { Model, ObjectId } from "mongoose";
import { ConflictException, Injectable, StreamableFile } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PageContent } from "./page-content.interface";
import { ErrorMessageException } from "../common/exceptions";
import { FileUploadService } from "../common/services/upload.service";
import config from "../config";
import { Customer } from "../customer/customer.interface";
import { User, UserType } from "../user/user.interface";
import { LotteryType } from "../lottery/lottery.interface";
import { LotteryService } from "../lottery/lottery.service";


@Injectable()
export class PageContentService {
  constructor(
    @InjectModel("PageContent") private readonly pageContentModel: Model<PageContent>,
    // private readonly fileUploadService: FileUploadService,
  ) { }
   
  async findBySlug(slug?: string): Promise<PageContent> {
    const pageContent = await this.pageContentModel
      .findOne(
        {
          slug,
          isActive: true
        }
        )
    if (!pageContent) {
      throw ErrorMessageException("User unable to fetch page-content");
    }
    if (!pageContent.isActive) {
      throw ErrorMessageException("This page-content is not active");
    }
    return pageContent;
  }

  async find(): Promise<PageContent[]> {
    const pageContents = await this.pageContentModel
      .find(
        {
          isActive: true
        }
        )
    if (!pageContents) {
      throw ErrorMessageException("User unable to fetch page-content");
    }
    
    return pageContents;
  }

  async create(
    user: User,
    pageContentDto: Partial<PageContent>,
  ):
    Promise<PageContent> {
      try {
        const pageContent = await this.pageContentModel.create({
          userId: user._id,
          ...pageContentDto
        });
        return pageContent;
      } catch (error) {
        throw ErrorMessageException(" slug must be unique");
      }
  }

  async update(
    user: User,
    pageContentDto: Partial<PageContent>,
    _id: string
  ):
    Promise<PageContent | null> {
      try {
        const pageContent = await this.pageContentModel.findByIdAndUpdate(_id, {
          userId: user._id,
          ...pageContentDto,
          $set: {
            content: pageContentDto.content,
            subject: pageContentDto.subject
          }
        },
        {
          new: true
        });
        return pageContent;
      } catch (error) {
        throw ErrorMessageException("this slug already exist");
      }
  }
  
  async delete(id: string): Promise<PageContent> {
    const existingPageContent = await this.pageContentModel.findById(id);
    if (!existingPageContent) {
      throw ErrorMessageException("User unable to delete template");
    }
    const pageContent = await this.pageContentModel.findOneAndUpdate({
      _id: id
    }, {
      isActive: false,
      slug: existingPageContent.slug + '_' +  new Date().getTime()
    }, {
      new: true
    });
    if (!pageContent) {
      throw ErrorMessageException("User unable to delete template");
    }
    return pageContent;
  }
}