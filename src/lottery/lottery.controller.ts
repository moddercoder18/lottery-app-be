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
import { LotteryService } from "./lottery.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "../user/user.interface";
import { HistoryLotteryFilterDto, AdminLotteryFilterDto, LotteryDto, SetWiningNumberDto } from "./lottery.interface";
import { excelFileFilter, imageFileFilter, multerStorage } from "../common/multer";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ObjectId } from 'mongoose'
import { Cron, CronExpression } from "@nestjs/schedule";
@ApiTags("lottery")
@Controller("lottery")
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) { }

  @Get("")
  getActiveLotteries(@Req() req: Request) {
    const timezone = req.header('timezone') || 'America/Los_Angeles';
    return this.lotteryService.getActiveLotteries(timezone);
  }

  @Get("cron")
  async getLiveLottery(@Req() req: Request) {
    const timezone = req.header('timezone') || 'America/Los_Angeles';
    await this.lotteryService.lotteryPowerBallCron();
    await this.lotteryService.lotteryMegaMillionCron();
  }


  @Get("history")
  history(@Req() req: Request) {
    const timezone = req.header('timezone') || 'America/Los_Angeles';
    return this.lotteryService.getAllExpireLottery(timezone);
  }

  @Post("admin")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  getAdminLotteries(@Req() req: Request, @Body() lotteryDto: AdminLotteryFilterDto) {
    const timezone = req.header('timezone') || 'America/Los_Angeles';
    const user = req.user as User;
    return this.lotteryService.getAdminLotteries(user, lotteryDto, timezone);
  }
  
  @Get(":id")
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.lotteryService.findById(id);
  }

  @Post("")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        description: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        startDate: { type: 'Date'},
        endDate: { type: 'Date'},
        ticketPricePerLine: { type: 'number'},
        multiplier: {type: 'number'},
        multiplierPricePerLine: { type: 'number'},
        priceCurrency: { type: 'string'},
        markAsComplete: { type: 'boolean'},
        markAsPublish: { type: 'boolean'},
        prizeBreakDown: {
          type: "array",
          properties: {
           items: {
             type: "object",
             properties: {
               price: { type: 'number'},
               number: {type: 'number'},
               powerNumber: { type: 'number'}
             }
           }
          } 
         },
        timeZone: { type: 'string'},
        hasMultiDraw: { type: 'boolean'},
        winningPrice: { type: 'number' },
        ticketLines: { type: 'number'},
        backgroundColor: { type: 'string' },
        file: {
          type: "string",
          format: "binary",
        },
        multiDrawOptions: {
          type: "array", properties: {
            items: {
              type: "object",
              properties: {
                value: {
                  type: "string"
                },
                label: {
                  type: "string"
                }
              }
            }
          }
        },
        numbersPerLine: {
          type: "object",
          properties: {
            totalShowNumber: {
              type: "number"
            },
            totalShowPowerNumber: {
              type: "number"
            },
            maxSelectTotalNumber: {
              type: "number"
            },
            maxSelectTotalPowerNumber: {
              type: "number"
            }
          }
        },
        winningNumbers: {
          type: "object",
          properties: {
            number: {
              type: "array",
              properties: {
                items: {
                  type: "number"
                }
              }
            },
            powerNumbers: {
              type: "array",
              properties: {
                items: {
                  type: "number"
                }
              }
            }
          }
        }
      },

    }
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multerStorage,
      fileFilter: imageFileFilter,
    }),
  )
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth("JWT-auth")
  addLottery(@Req() req: Request, @UploadedFile("file") media: Express.Multer.File, @Body() lotteryDto: LotteryDto) {
    const user = req.user as User;
    const timezone = req.header('timezone') || 'America/Los_Angeles';
    return this.lotteryService.create(
      user,
      lotteryDto as any, media as any, timezone);
  }

  @Put(":id")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        description: { type: 'string' },
        name: { type: 'string' },
        winningPrice: { type: 'number' },
        ticketLines: { type: 'number'},
        type: { type: 'string' },
        startDate: { type: 'Date'},
        endDate: { type: 'Date'},
        ticketPricePerLine: { type: 'number'},
        multiplier: {type: 'number'},
        multiplierPricePerLine: { type: 'number'},
        priceCurrency: { type: 'string'},
        markAsComplete: { type: 'boolean'},
        markAsPublish: { type: 'boolean'},
        prizeBreakDown: {
         type: "array",
         properties: {
          items: {
            type: "object",
            properties: {
              price: { type: 'number'},
              number: {type: 'number'},
              powerNumber: { type: 'number'}
            }
          }
         } 
        },
        timeZone: { type: 'string'},
        hasMultiDraw: { type: 'boolean'},
        backgroundColor: { type: 'string' },
        file: {
          type: "string",
          format: "binary",
        },
        multiDrawOptions: {
          type: "array", properties: {
            items: {
              type: "object",
              properties: {
                value: {
                  type: "string"
                },
                label: {
                  type: "string"
                }
              }
            }
          }
        },
        numbersPerLine: {
          type: "object",
          properties: {
            totalShowNumber: {
              type: "number"
            },
            totalShowPowerNumber: {
              type: "number"
            },
            maxSelectTotalNumber: {
              type: "number"
            },
            maxSelectTotalPowerNumber: {
              type: "number"
            }
          }
        },
        winningNumbers: {
          type: "object",
          properties: {
            numbers: {
              type: "array",
              properties: {
                items: {
                  type: "number"
                }
              }
            },
            powerNumbers: {
              type: "array",
              properties: {
                items: {
                  type: "number"
                }
              }
            }
          }
        }
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multerStorage,
      fileFilter: imageFileFilter,
    }),
  )
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth("JWT-auth")
  async updateLottery(
    @UploadedFile("file") media: Express.Multer.File,
    @Req() req: Request,
    @Body() lotteryDto: LotteryDto,
    @Param('id') id: string
  ) {
    const timezone = req.header('timezone') || 'America/Los_Angeles';
    const user = req.user as User;
    return this.lotteryService.update(id, user, lotteryDto as any, media, timezone);
  }

  @Put("/setWinningNumber/:id")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  async updateWinningNumber(
    @Req() req: Request,
    @Body() setWiningNumberDto: SetWiningNumberDto,
    @Param('id') id: string
  )  {
    const user = req.user as User;
    return this.lotteryService.setWinningNumber(id, user, setWiningNumberDto as any);
  }

  @Delete(":id")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  deleteLottery(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.lotteryService.delete(id, user._id);
  }
  
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Los_Angeles'
  }) // 12 PM
  async getLotteries() {
    console.log('called =======>', new Date())
    if (process.env.DISABLE_CRON) {
      return '';
    }
    console.log(`Start  =======> 0 0 0 * * *`, {
      timeZone: 'America/Los_Angeles'
    }, new Date())
    try {
      await this.lotteryService.lotteryPowerBallCron();
      await this.lotteryService.lotteryMegaMillionCron();
    } catch (error) {
      console.log('Error =======> 0 0 0 * * *', {
        timeZone: 'America/Los_Angeles'
      }, new Date(), error);
    }
  }

}
