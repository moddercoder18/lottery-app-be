import { Model, ObjectId } from "mongoose";
import { ConflictException, Inject, Injectable, StreamableFile, UseFilters, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Lottery, LotteryType, MegaMillionsLotteryStatic, PowerBallLotteryStatic } from "./lottery.interface";
import { ErrorMessageException } from "../common/exceptions";
import { FileUploadService } from "../common/services/upload.service";
import config from "../config";
import { User, UserType } from "../user/user.interface";
import * as moment from 'moment-timezone';
import { CustomerTicketService } from "../customer-ticket/customer-ticket.service";
import { PageContentService } from "../page-content/page-content.service";
import { CustomerMailerService } from "../customer/customer.mailer.service";
import { CustomerService } from "../customer/customer.service";
import { CustomerPhoneService } from "../customer/customer.phone.service";
import { HttpService } from "@nestjs/axios";
import { UserService } from "../user/user.service";
import { SettingService } from "../setting/setting.service";

@Injectable()
export class LotteryService {
  constructor(
    @InjectModel("Lottery") private readonly lotteryModel: Model<Lottery>,
    private readonly fileUploadService: FileUploadService,
    @Inject(forwardRef(() => CustomerTicketService))
    private readonly customerTicketService: CustomerTicketService, private readonly customerMailerService: CustomerMailerService,
    private readonly customerService: CustomerService, private readonly customerPhoneService: CustomerPhoneService,
    private readonly pageContentService: PageContentService, private readonly httpService: HttpService,
    private readonly userService: UserService, private readonly settingService: SettingService,
  ) { }

  async getActiveLotteries(timezone: string, type: LotteryType[] = [LotteryType.MegaMillions, LotteryType.PowerBall]): Promise<Lottery[]> {
    const lotteries = await this.lotteryModel
      .find({
        isActive: true,
        markAsPublish: true,
        markAsComplete: false,
        type: {
          $in: type
        }
        // endDate: {
        //   $gte: moment(new Date()).tz(timezone)
        // }
      }).sort({
        'winningPrice': -1
      })
    return lotteries;
  }

  async getAllExpireLottery(timezone: string): Promise<Lottery[]> {
    const lotteries = await this.lotteryModel.find({
      isActive: true,
      markAsPublish: true,
      endDate: {
        $lte: moment(new Date()).tz(timezone)
      }
    })
    return lotteries
  }

  async getAdminLotteries(user: User, filters: any = {}, timezone: string): Promise<Lottery[]> {
    if (!(user.type === UserType.ADMIN || user.type === UserType.SUPER_ADMIN)) {
      throw ErrorMessageException("User unable to create lottery");
    }
    const lotteries = await this.lotteryModel
      .find({
        isActive: true,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.startDate && filters.endDate ? {
          startDate: {
            $gte: moment(filters.startDate).startOf('day').tz(timezone),
          }, endDate: {
            $lte: moment(filters.endDate).endOf('day').tz(timezone)
          }
        } : filters.startDate ? {
          startDate: {
            $gte: moment(filters.startDate).startOf('day').tz(timezone),
          }
        } : filters.endDate ? {
          endDate: {
            $lte: moment(filters.endDate).endOf('day').tz(timezone)
          }
        } : {}),
      }).sort({
        'startDate': -1
      })
    if (!lotteries) {
      throw ErrorMessageException("User unable to fetch lottery");
    }
    return lotteries;
  }

  async findById(_id?: string): Promise<Lottery> {
    const lottery = await this.lotteryModel
      .findById(_id)
    if (!lottery) {
      throw ErrorMessageException("User unable to fetch lottery");
    }
    if (!lottery.isActive) {
      throw ErrorMessageException("This lottery is not active");
    }
    return lottery;
  }

  async create(
    user: User,
    lotteryDto: Partial<Lottery>,
    media: Express.Multer.File | null,
    timezone: string
  ):
    Promise<Lottery> {
    if (!(user.type === UserType.ADMIN || user.type === UserType.SUPER_ADMIN)) {
      throw ErrorMessageException("User unable to create lottery");
    }
    const converter = (e:number) => {
      const prize = e * 1;
      return Intl.NumberFormat('en', {
        style: 'currency',
        minimumIntegerDigits: 1,
        currency: 'USD',
        currencyDisplay: 'symbol'
      }).format(prize);
    }
    const inputObj: Partial<Lottery> = {
      ...lotteryDto,
      startDate: lotteryDto.startDate,
      endDate: lotteryDto.endDate,
      numbersPerLine: {
        totalShowNumber: Number(lotteryDto?.numbersPerLine?.totalShowNumber || 0),
        totalShowPowerNumber: Number(lotteryDto?.numbersPerLine?.totalShowPowerNumber || 0),
        maxSelectTotalNumber: Number(lotteryDto?.numbersPerLine?.maxSelectTotalNumber || 0),
        maxSelectTotalPowerNumber: Number(lotteryDto?.numbersPerLine?.maxSelectTotalPowerNumber || 0)
      },
      prizeBreakDown: lotteryDto.prizeBreakDown?.map((p) => ({
        number: Number(p.number),
        price: isNaN(Number(p.price)) ? 0 : p.price,
        powerNumber: Number(p.powerNumber)
      })) || []
    };
    const errors = this.validateLottery(inputObj, null);
    if (errors.length) {
      throw ErrorMessageException(errors.join('/n'));
    }
    const imageUrlObj: { image?: string } = {};
    if (media && process.env.AWS_ACCESS_KEY_ID) {
      imageUrlObj.image = await this.fileUploadService.upload(media);
    } else if (media) {
      imageUrlObj.image = `${config.apiUrl}/uploads/${media.filename}`;
    }
    const lottery = await this.lotteryModel.create({
      ...inputObj,
      ...imageUrlObj,
      userId: user._id,
      numbersPerLine: inputObj.numbersPerLine
    });
    const customers = await this.customerService.findAll();
    const emailData = await this.pageContentService.findBySlug('lottery-notification');
    customers.forEach(async (customer) => {
      try {
        let emailSubject = emailData.subject[customer.language || 'en'] ?
          emailData.subject[customer.language || 'en'] : (emailData.subject.en || '');
        let emailTemplate = emailData.content[customer.language || 'en'] ?
          emailData.content[customer.language || 'en'] : (emailData.content.en || '');
        emailSubject = emailSubject.replace('{{CUSTOMER_NAME}}', `${customer.name}`);
        emailSubject = emailSubject.replace('{{PRIZE}}', `${converter(lottery.winningPrice/1e6)} Million`);
        emailSubject = emailSubject.replace('{{TYPE}}', `${lottery.type}`);
        emailTemplate = emailTemplate.replace('{{CUSTOMER_NAME}}', `${customer.name}`);
        emailTemplate = emailTemplate.replace('{{PRIZE}}', `${converter(lottery.winningPrice/1e6)} Million`);
        emailTemplate = emailTemplate.replace('{{TYPE}}', `${lottery.type}`);
        await this.customerMailerService.sendMailToCustomer(customer.email, emailSubject, emailTemplate);
      } catch (error) {
        console.log(`Error while sending winning email to customer`)
      }
      try {
        
        const msg =  `Hi ${customer.name} Don’t miss ${lottery.type} US${converter(lottery.winningPrice/1e6)} Million jackpot please visit link http://3.129.62.246/lottery-tickets`;
        console.log(msg);
        await this.customerPhoneService.sendSmsToCustomer(customer.phoneNo, msg);
      } catch (error) {
        console.log(`Error while sending winning sms to customer`)
      }
    })

    return lottery;
  }

  async update(
    _id: string,
    user: User,
    lotteryDto: Partial<Lottery>,
    media: Express.Multer.File,
    timezone: string
  ): Promise<Lottery> {
    if (!(user.type === UserType.ADMIN || user.type === UserType.SUPER_ADMIN)) {
      throw ErrorMessageException("User unable to update lottery");
    }
    const inputObj: Partial<Lottery> = {
      ...lotteryDto,
      startDate: new Date(moment(lotteryDto.startDate).startOf('day').tz(lotteryDto.timeZone || timezone).format()),
      endDate: new Date(moment(lotteryDto.endDate).endOf('day').tz(lotteryDto.timeZone || timezone).format()),
      numbersPerLine: {
        totalShowNumber: Number(lotteryDto?.numbersPerLine?.totalShowNumber || 0),
        totalShowPowerNumber: Number(lotteryDto?.numbersPerLine?.totalShowPowerNumber || 0),
        maxSelectTotalNumber: Number(lotteryDto?.numbersPerLine?.maxSelectTotalNumber || 0),
        maxSelectTotalPowerNumber: Number(lotteryDto?.numbersPerLine?.maxSelectTotalPowerNumber || 0)
      },
      prizeBreakDown: lotteryDto.prizeBreakDown?.map((p) => ({
        number: Number(p.number),
        price: Number(p.price),
        powerNumber: Number(p.powerNumber)
      })) || []
    };
    const existingLottery = await this.lotteryModel.findById(_id);
    const errors = this.validateLottery(inputObj, existingLottery);
    const imageUrlObj: { image?: string } = {};
    if (media && process.env.AWS_ACCESS_KEY_ID) {
      imageUrlObj.image = await this.fileUploadService.upload(media);
    } else if (media) {
      imageUrlObj.image = `${config.apiUrl}/uploads/${media.filename}`;
    }

    if (errors.length) {
      throw ErrorMessageException(errors.join('\n'));
    }
    const lottery = await this.lotteryModel.findOneAndUpdate(
      {
        _id,
        isActive: true,
        user: user._id,
      },
      {
        ...inputObj,
        ...imageUrlObj,
        numbersPerLine: inputObj.numbersPerLine
      },
      {
        new: true
      }
    );
    if (!lottery) {
      throw ErrorMessageException("User unable to fetch lottery");
    }
    return lottery;
  }

  async setWinningNumber(
    _id: string,
    user: User,
    setWiningNumberDto: Partial<Lottery>,
  ): Promise<Lottery> {
    if (!(user.type === UserType.ADMIN || user.type === UserType.SUPER_ADMIN)) {
      throw ErrorMessageException("user unable to fetch winning number")
    }
    const winningNumber = await this.lotteryModel.findOneAndUpdate(
      {
        _id,
      },
      {
        ...setWiningNumberDto,
        markAsComplete: true
      },
      {
        new: true
      }
    )
    if (!winningNumber) {
      throw ErrorMessageException(" unable to fetch winning number ")
    }
    await this.customerTicketService.findWinners(winningNumber);
    return winningNumber
  }

  async delete(id: string, userId: string): Promise<Lottery> {
    const lottery = await this.lotteryModel.findOneAndUpdate({
      _id: id, userId
    }, {
      isActive: false,
      userId,
    }, {
      new: true
    });
    if (!lottery) {
      throw ErrorMessageException("User unable to delete lottery");
    }
    return lottery;
  }

  validateLottery(lottery: Partial<Lottery>, existingLottery: Lottery | null) {
    const errors = [];
    if (existingLottery?.markAsComplete) {
      throw ErrorMessageException("This lottery already completed");
    }
    if (existingLottery?.markAsPublish && new Date(lottery.startDate || existingLottery.startDate || '').getTime() < new Date().getTime()) {
      throw ErrorMessageException("This lottery already started or complete");
    }
    if (new Date(lottery.startDate || '').getTime() > new Date(lottery.endDate || '').getTime()) {
      errors.push('Start date should be less then end date');
    }
    if (lottery.numbersPerLine) {
      if (lottery.numbersPerLine?.totalShowNumber < lottery.numbersPerLine?.maxSelectTotalNumber) {
        errors.push('Selected number count should be less or equal to showing numbers');
      }
      if (lottery.numbersPerLine?.totalShowPowerNumber < lottery.numbersPerLine?.maxSelectTotalPowerNumber) {
        errors.push('Selected power number count should be less or equal to showing power numbers');
      }
    }
    if (lottery?.winningPrice && lottery?.ticketPricePerLine && lottery?.winningPrice < lottery?.ticketPricePerLine) {
      errors.push('Ticket price should be less then winning price');
    }
    return errors;
  }
  convertTZ(date: any, tzString: string) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
  }

  async lotteryPowerBallCron() {
    const setting = await this.settingService.getAllData();
    const response = await this.httpService.get(`https://api.collectapi.com/chancegame/usaPowerball`, {
      params: {
      },
      headers: {
        "content-type": "application/json",
        "authorization": `apikey ${setting.setting.lotteryAPIKey}`
      }
    }).toPromise();
    console.log('response', JSON.stringify(response?.data, null, 4));
    const res = response?.data;
    if (res.success && res.result) {
      const adminUser = await this.userService.findByEmail('superadmin@yopmail.com');
      if (!adminUser) {
        console.log(`Not found admin user`);
        return;
      }
      const jackpot = res.result.jackpot.match(/\d+/);
      const oldLotteryEndDate = new Date(moment(new Date(res.result.date)).utc().add('h', 25.5).format())
      const findOldLottery = await this.lotteryModel.findOne({
        endDate: {
          $eq: new Date(oldLotteryEndDate).getTime(),
        },
        type: LotteryType.PowerBall
      });
      const oldMultiplier = res.result.powerplay.match(/\d+/);
      if (findOldLottery) {
        const lottery = await this.lotteryModel.findByIdAndUpdate(findOldLottery._id, {
          $set: {
            multiplier: oldMultiplier?.length && Number(oldMultiplier) ? Number(oldMultiplier) : PowerBallLotteryStatic.multiplier,
            winningPrice: jackpot?.length ? Number(jackpot[0]) * 1000000 : 0,
            winningNumbers: {
              numbers: [res.result.numbers.n1, res.result.numbers.n2, res.result.numbers.n3, res.result.numbers.n4, res.result.numbers.n5].map((n) => Number(n)),
              powerNumbers: [Number(res.result.numbers.pb)]
            },
            prizeBreakDown: [...PowerBallLotteryStatic.prizeBreakDown].map(({ number, powerNumber, price }) => ({
              number, powerNumber, price: Number(String(price).replace('{{JACK_POT}}', `${jackpot?.length ? Number(jackpot[0]) * 1000000 : 0}`))
            })),
          }
        }, {
          new: true
        });
        if (!findOldLottery?.winningNumbers?.numbers?.length && lottery?.winningNumbers?.numbers?.length) {
          await this.setWinningNumber(findOldLottery._id, adminUser, {
            winningNumbers: lottery?.winningNumbers
          })
        }
      } else {
        const oldLottery = await this.create(adminUser, {
          userId: adminUser._id,
          isActive: true,
          name: PowerBallLotteryStatic.name,
          image: PowerBallLotteryStatic.image,
          description: PowerBallLotteryStatic.description,
          winningPrice: jackpot?.length ? Number(jackpot[0]) * 1000000 : 0,
          type: LotteryType.PowerBall,
          startDate: new Date(moment(oldLotteryEndDate).startOf('day').subtract(5, 'days').format()),
          endDate: oldLotteryEndDate,
          numbersPerLine: { ...PowerBallLotteryStatic.numbersPerLine },
          winningNumbers: {
            numbers: [res.result.numbers.n1, res.result.numbers.n2, res.result.numbers.n3, res.result.numbers.n4, res.result.numbers.n5].map((n) => Number(n)),
            powerNumbers: [Number(res.result.numbers.pb)]
          },
          ticketPricePerLine: setting?.setting?.powerMillionTicketPrice || PowerBallLotteryStatic.ticketPrice,
          multiplierPricePerLine: setting?.setting?.powerMillionMultiplierPrice || PowerBallLotteryStatic.multiplierPrice,
          priceCurrency: 'USD',
          markAsComplete: true,
          markAsPublish: true,
          prizeBreakDown: [...PowerBallLotteryStatic.prizeBreakDown].map(({ number, powerNumber, price }) => ({
            number, powerNumber, price: Number(String(price).replace('{{JACK_POT}}', `${jackpot?.length ? Number(jackpot[0]) * 1000000 : 0}`))
          })),
          timeZone: PowerBallLotteryStatic.timeZone,
          hasMultiDraw: false,
          multiDrawOptions: [],
          multiplier: oldMultiplier?.length && Number(oldMultiplier) ? Number(oldMultiplier) : PowerBallLotteryStatic.multiplier,
          ticketLines: 800,
          backgroundColor: PowerBallLotteryStatic.backgroundColor,
        }, null, PowerBallLotteryStatic.timeZone)
      }
      const nextJackpot = res.result["next-jackpot"].amount.match(/\d+/);
      const newLotteryEndDate = new Date(moment(new Date(res.result["next-jackpot"].date)).utc().add('h', 25.5).format())
      const findNewLottery = await this.lotteryModel.findOne({
        endDate: {
          $eq: new Date(newLotteryEndDate).getTime(),
        },
        type: LotteryType.PowerBall
      });
      const multiplier = res.result.powerplay.match(/\d+/);
      if (findNewLottery) {
        await this.lotteryModel.findByIdAndUpdate(findNewLottery._id, {
          $set: {
            multiplier: multiplier?.length && Number(multiplier) ? Number(multiplier) : PowerBallLotteryStatic.multiplier,
            winningPrice: nextJackpot?.length ? Number(nextJackpot[0]) * 1000000 : 0,
            markAsComplete: false,
            prizeBreakDown: [...PowerBallLotteryStatic.prizeBreakDown].map(({ number, powerNumber, price }) => ({
              number, powerNumber, price: Number(String(price).replace('{{JACK_POT}}', `${nextJackpot?.length ? Number(nextJackpot[0]) * 1000000 : 0}`))
            })),
          }
        });
      } else {
        const newLottery = await this.create(adminUser, {
          userId: adminUser._id,
          isActive: true,
          name: PowerBallLotteryStatic.name,
          image: PowerBallLotteryStatic.image,
          description: PowerBallLotteryStatic.description,
          winningPrice: nextJackpot?.length ? Number(nextJackpot[0]) * 1000000 : 0,
          type: LotteryType.PowerBall,
          startDate: new Date(moment(newLotteryEndDate).startOf('day').subtract(5, 'days').format()),
          endDate: newLotteryEndDate,
          numbersPerLine: { ...PowerBallLotteryStatic.numbersPerLine },
          winningNumbers: {
            numbers: [],
            powerNumbers: []
          },
          ticketPricePerLine: setting?.setting?.powerMillionTicketPrice || PowerBallLotteryStatic.ticketPrice,
          multiplierPricePerLine: setting?.setting?.powerMillionMultiplierPrice || PowerBallLotteryStatic.multiplierPrice,
          priceCurrency: 'USD',
          markAsComplete: false,
          markAsPublish: true,
          prizeBreakDown: [...PowerBallLotteryStatic.prizeBreakDown].map(({ number, powerNumber, price }) => ({
            number, powerNumber, price: Number(String(price).replace('{{JACK_POT}}', `${nextJackpot?.length ? Number(nextJackpot[0]) * 1000000 : 0}`))
          })),
          timeZone: PowerBallLotteryStatic.timeZone,
          hasMultiDraw: false,
          multiDrawOptions: [],
          multiplier: multiplier?.length && Number(multiplier) ? Number(multiplier) : PowerBallLotteryStatic.multiplier,
          ticketLines: 800,
          backgroundColor: PowerBallLotteryStatic.backgroundColor,
        }, null, PowerBallLotteryStatic.timeZone)
      }

    } else {
      console.log(`Unable to get response of cron api`)
    }
  }

  async lotteryMegaMillionCron() {
    const setting = await this.settingService.getAllData();
    const response = await this.httpService.get(`https://api.collectapi.com/chancegame/usaMegaMillions`, {
      params: {
      },
      headers: {
        "content-type": "application/json",
        "authorization": `apikey ${setting.setting.lotteryAPIKey}`
      }
    }).toPromise();
    console.log('response', JSON.stringify(response?.data, null, 4));
    const res = response?.data;
    if (res.success && res.result) {
      const adminUser = await this.userService.findByEmail('superadmin@yopmail.com');
      if (!adminUser) {
        console.log(`Not found admin user`);
        return;
      }
      const jackpot = res.result.jackpot.match(/\d+/);
      const oldLotteryEndDate = new Date(moment(new Date(res.result.date)).utc().add('h', 25.5).format())
      const findOldLottery = await this.lotteryModel.findOne({
        endDate: {
          $eq: new Date(oldLotteryEndDate).getTime(),
        },
        type: LotteryType.MegaMillions
      });
      const oldMultiplier = res.result.megaplier.match(/\d+/);
      if (findOldLottery) {
        const lottery = await this.lotteryModel.findByIdAndUpdate(findOldLottery._id, {
          $set: {
            multiplier: oldMultiplier?.length && Number(oldMultiplier) ? Number(oldMultiplier) : MegaMillionsLotteryStatic.multiplier,
            winningPrice: jackpot?.length ? Number(jackpot[0]) * 1000000 : 0,
            winningNumbers: {
              numbers: [res.result.numbers.n1, res.result.numbers.n2, res.result.numbers.n3, res.result.numbers.n4, res.result.numbers.n5].map((n) => Number(n)),
              powerNumbers: [Number(res.result.numbers.mb)]
            },
            prizeBreakDown: [...MegaMillionsLotteryStatic.prizeBreakDown].map(({ number, powerNumber, price }) => ({
              number, powerNumber, price: Number(String(price).replace('{{JACK_POT}}', `${jackpot?.length ? Number(jackpot[0]) * 1000000 : 0}`))
            })),
          }
        }, {
          new: true
        });
        if (!findOldLottery?.winningNumbers?.numbers?.length && lottery?.winningNumbers?.numbers?.length) {
          await this.setWinningNumber(findOldLottery._id, adminUser, {
            winningNumbers: lottery?.winningNumbers
          })
        }
      } else {
        const oldLottery = await this.create(adminUser, {
          userId: adminUser._id,
          isActive: true,
          name: MegaMillionsLotteryStatic.name,
          image: MegaMillionsLotteryStatic.image,
          description: MegaMillionsLotteryStatic.description,
          winningPrice: jackpot?.length ? Number(jackpot[0]) * 1000000 : 0,
          type: LotteryType.MegaMillions,
          startDate: new Date(moment(oldLotteryEndDate).startOf('day').subtract(5, 'days').format()),
          endDate: oldLotteryEndDate,
          numbersPerLine: { ...MegaMillionsLotteryStatic.numbersPerLine },
          winningNumbers: {
            numbers: [res.result.numbers.n1, res.result.numbers.n2, res.result.numbers.n3, res.result.numbers.n4, res.result.numbers.n5].map((n) => Number(n)),
            powerNumbers: [Number(res.result.numbers.mb)]
          },
          ticketPricePerLine: setting?.setting?.megaMillionTicketPrice || MegaMillionsLotteryStatic.ticketPrice,
          multiplierPricePerLine: setting?.setting?.megaMillionMultiplierPrice || MegaMillionsLotteryStatic.multiplierPrice,
          priceCurrency: 'USD',
          markAsComplete: true,
          markAsPublish: true,
          prizeBreakDown: [...MegaMillionsLotteryStatic.prizeBreakDown].map(({ number, powerNumber, price }) => ({
            number, powerNumber, price: Number(String(price).replace('{{JACK_POT}}', `${jackpot?.length ? Number(jackpot[0]) * 1000000 : 0}`))
          })),
          timeZone: MegaMillionsLotteryStatic.timeZone,
          hasMultiDraw: false,
          multiDrawOptions: [],
          multiplier: oldMultiplier?.length && Number(oldMultiplier) ? Number(oldMultiplier) : MegaMillionsLotteryStatic.multiplier,
          ticketLines: 800,
          backgroundColor: MegaMillionsLotteryStatic.backgroundColor,
        }, null, MegaMillionsLotteryStatic.timeZone)
      }
      const nextJackpot = res.result["next-jackpot"].amount.match(/\d+/);
      const newLotteryEndDate = new Date(moment(new Date(res.result["next-jackpot"].date)).utc().add('h', 25.5).format())
      const findNewLottery = await this.lotteryModel.findOne({
        endDate: {
          $eq: new Date(newLotteryEndDate).getTime(),
        },
        type: LotteryType.MegaMillions
      });
      const multiplier = res.result.megaplier.match(/\d+/);
      if (findNewLottery) {
        await this.lotteryModel.findByIdAndUpdate(findNewLottery._id, {
          $set: {
            multiplier: multiplier?.length && Number(multiplier) ? Number(multiplier) : MegaMillionsLotteryStatic.multiplier,
            winningPrice: nextJackpot?.length ? Number(nextJackpot[0]) * 1000000 : 0,
            markAsComplete: false,
            prizeBreakDown: [...MegaMillionsLotteryStatic.prizeBreakDown].map(({ number, powerNumber, price }) => ({
              number, powerNumber, price: Number(String(price).replace('{{JACK_POT}}', `${nextJackpot?.length ? Number(nextJackpot[0]) * 1000000 : 0}`))
            })),
          }
        });
      } else {
        const newLottery = await this.create(adminUser, {
          userId: adminUser._id,
          isActive: true,
          name: MegaMillionsLotteryStatic.name,
          image: MegaMillionsLotteryStatic.image,
          description: MegaMillionsLotteryStatic.description,
          winningPrice: nextJackpot?.length ? Number(nextJackpot[0]) * 1000000 : 0,
          type: LotteryType.MegaMillions,
          startDate: new Date(moment(newLotteryEndDate).startOf('day').subtract(5, 'days').format()),
          endDate: newLotteryEndDate,
          numbersPerLine: { ...MegaMillionsLotteryStatic.numbersPerLine },
          winningNumbers: {
            numbers: [],
            powerNumbers: []
          },
          ticketPricePerLine: setting?.setting?.megaMillionTicketPrice || MegaMillionsLotteryStatic.ticketPrice,
          multiplierPricePerLine: setting?.setting?.megaMillionMultiplierPrice || MegaMillionsLotteryStatic.multiplierPrice,
          priceCurrency: 'USD',
          markAsComplete: false,
          markAsPublish: true,
          prizeBreakDown: [...MegaMillionsLotteryStatic.prizeBreakDown].map(({ number, powerNumber, price }) => ({
            number, powerNumber, price: Number(String(price).replace('{{JACK_POT}}', `${nextJackpot?.length ? Number(nextJackpot[0]) * 1000000 : 0}`))
          })),
          timeZone: MegaMillionsLotteryStatic.timeZone,
          hasMultiDraw: false,
          multiDrawOptions: [],
          multiplier: multiplier?.length && Number(multiplier) ? Number(multiplier) : MegaMillionsLotteryStatic.multiplier,
          ticketLines: 800,
          backgroundColor: MegaMillionsLotteryStatic.backgroundColor,
        }, null, MegaMillionsLotteryStatic.timeZone)
      }
    } else {
      console.log(`Unable to get response of cron api`)
    }
  }
}