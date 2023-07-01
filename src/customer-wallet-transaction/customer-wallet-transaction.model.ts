import { MongooseModule } from "@nestjs/mongoose";
import { CustomerWalletTransactionSchema } from "./customer-wallet-transaction.schema";

export const CustomerWalletTransactionModel = MongooseModule.forFeature([
  { name: "CustomerWalletTransaction", schema: CustomerWalletTransactionSchema },
]);
