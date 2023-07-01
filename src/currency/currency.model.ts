import {MongooseModule} from "@nestjs/mongoose";
import {CurrencySchema} from "./currency.schema";

export const CurrencyModel = MongooseModule.forFeature([
  {name: "Currency", schema: CurrencySchema},
]);
