import {MongooseModule} from "@nestjs/mongoose";
import {TransactionSchema} from "./transaction.schema";

export const TransactionModel = MongooseModule.forFeature([
  {name: "Transaction", schema: TransactionSchema},
]);
