import {MongooseModule} from "@nestjs/mongoose";
import {CustomerWalletSchema} from "./customer-wallet.schema";

export const CustomerWalletModel = MongooseModule.forFeature([
  {name: "CustomerWallet", schema: CustomerWalletSchema},
]);
