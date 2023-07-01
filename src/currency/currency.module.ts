import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import setupSwagger from "./currency.swagger";
import { CurrencyController } from "./currency.controller";
import { CurrencyService } from "./currency.service";
import { CurrencyModel } from "./currency.model";

@Module({
  imports: [HttpModule, CurrencyModel],
  providers: [CurrencyService],
  controllers: [CurrencyController],
  exports: [CurrencyService],
})
export class CurrencyModule { }

setupSwagger(CurrencyModule)


