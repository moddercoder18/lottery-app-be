import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Setting, SettingDto, Country } from "./setting.interface";
import { User, UserType } from "../user/user.interface";
import { ErrorMessageException } from "../common/exceptions";
import { CurrencyService } from "../currency/currency.service";
import { Currency } from "../currency/currency.interface";
import countries from './countries';
@Injectable()
export class SettingService {
  constructor(
    @InjectModel("Setting") private readonly settingModel: Model<Setting>,
    private readonly currencyService: CurrencyService

  ) { }

  async getAllData(): Promise<{
    currency: Currency;
    setting: { serviceFee: number, referralDiscount: number, referralCommission: number, enableCustomerPickNumber: boolean, megaMillionTicketPrice: number, megaMillionMultiplierPrice: number, powerMillionTicketPrice: number, powerMillionMultiplierPrice: number, lotteryAPIKey: string}
    countries: Country[]
  }> {
    const settingData = await this.settingModel.find({})
    const currency = await this.currencyService.getCurrency({
      baseCurrency: 'USD',
      targetCurrencies: [
        "KRW",
        "CNY",
        "INR",
        "USD",
        "JPY",
        "PHP",
        "VND",
        "MYR"
      ]
    })
    return { currency, setting: settingData[0].setting, countries }
  }


  async update(settingDto: SettingDto, user: User): Promise<{ serviceFee: number, referralDiscount: number, referralCommission: number, enableCustomerPickNumber: boolean, megaMillionTicketPrice: number, megaMillionMultiplierPrice: number, powerMillionTicketPrice: number, powerMillionMultiplierPrice: number, lotteryAPIKey: string, }> {
    if (user.type !== UserType.SUPER_ADMIN) {
      throw ErrorMessageException("User unable to create lottery");
    }
    await this.settingModel.updateOne({},
      {
        $set: {
          setting: settingDto.setting
        },

      },
      {
        new: true
      }
    )
    const { setting } = await this.getAllData();
    return setting;
  }

}
