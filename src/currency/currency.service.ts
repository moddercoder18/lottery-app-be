import { Injectable } from "@nestjs/common";
import { Currency, CurrencyConverterDto, } from "./currency.interface";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
@Injectable()
export class CurrencyService {
  constructor(
    @InjectModel("Currency") private readonly currencyModel: Model<Currency>,
    private readonly httpService: HttpService) { }

  async getLiveCurrentCurrency(currencyConverterDto: CurrencyConverterDto): Promise<Currency | null> {
    const response = await this.httpService.get(`https://api.apilayer.com/fixer/latest`, {
      params: {
        base: currencyConverterDto.baseCurrency,
        symbols: currencyConverterDto.targetCurrencies.join(',')
      },
      headers: {
        apikey: '9LevrQAt2oC6yL2sZckXO1ashjfRN7BH'
      }
    }).toPromise();
    if (response?.data) {
      await this.currencyModel.updateMany({
        baseCurrency: currencyConverterDto.baseCurrency
      }, {
        $set: {
          isActive: false
        }
      });
      const currency = this.currencyModel.create({
        baseCurrency: currencyConverterDto.baseCurrency,
        rates: response?.data.rates,
        date: new Date(response?.data?.date || new Date().getTime())
      });
      return currency;
    } else {
      return null
    }
   
  }

  async getCurrency(currencyConverterDto: CurrencyConverterDto): Promise<Currency> {
    const currency = await this.currencyModel.findOne({
      isActive: true,
      baseCurrency: currencyConverterDto.baseCurrency
    });
    if (!currency) {
      return this.getLiveCurrentCurrency(currencyConverterDto) as unknown as Currency;
    }
    return currency;
  }
}