import {
  Controller,
  Post,
  Body,
  Get
} from "@nestjs/common";
import { CurrencyService } from "./currency.service";
import { ApiTags } from "@nestjs/swagger";
import { CurrencyConverterDto } from "./currency.interface";
import { Cron, CronExpression } from "@nestjs/schedule";

@ApiTags("currency")
@Controller("currency")
export class CurrencyController {
  constructor(private readonly customerTicketService: CurrencyService) { }

  @Get("/converter")
  getCurrency() {
    return this.customerTicketService.getCurrency({
      baseCurrency: 'USD',
      targetCurrencies: [
        "KRW",
        "CNY",
        "INR",
        "USD",
        "JPY",
        "PHP",
        "VND",
        "MYR",
        "IDR"
      ]
    });
  }

  @Post("/live")
  getLiveCurrentCurrency(@Body() currencyConverterDto: CurrencyConverterDto) {
    return this.customerTicketService.getLiveCurrentCurrency(
      currencyConverterDto);
  }


  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    timeZone: 'Asia/Seoul'
  }) // 3 AM UTC / 12 PM KST
  liveCurrencyCron8AM() {
    if (process.env.DISABLE_CRON) {
      return '';
    }
    try {
      this.customerTicketService.getLiveCurrentCurrency(
        {
          baseCurrency: 'USD',
          targetCurrencies: [
            "KRW",
            "CNY",
            "INR",
            "USD",
            "JPY",
            "PHP",
            "VND",
            "MYR",
            "IDR"
          ]
        });
    } catch (error) {
      console.log('Error =======> 0 8 * * *', new Date(), error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON, {
    timeZone: 'Asia/Seoul'
  })  // 3 AM UTC / 12 PM KST
  liveCurrencyCron12AM() {
    if (process.env.DISABLE_CRON) {
      return '';
    }
    console.log(`Start  =======> 0 12 * * *`, new Date())
    try {
      this.customerTicketService.getLiveCurrentCurrency(
        {
          baseCurrency: 'USD',
          targetCurrencies: [
            "KRW",
            "CNY",
            "INR",
            "USD",
            "JPY",
            "PHP",
            "VND",
            "MYR",
            "IDR"
          ]
        });
    } catch (error) {
      console.log('Error =======> 0 12 * * *', new Date(), error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4PM, {
    timeZone: 'Asia/Seoul'
  }) // 3 AM UTC / 12 PM KST
  liveCurrencyCron4PM() {
    if (process.env.DISABLE_CRON) {
      return '';
    }
    console.log(`Start  =======> 0 16 * * *`, new Date())
    try {
      this.customerTicketService.getLiveCurrentCurrency(
        {
          baseCurrency: 'USD',
          targetCurrencies: [
            "KRW",
            "CNY",
            "INR",
            "USD",
            "JPY",
            "PHP",
            "VND",
            "MYR",
            "IDR"
          ]
        });
    } catch (error) {
      console.log('Error =======> 0 16 * * *', new Date(), error);
    }
  }
}
