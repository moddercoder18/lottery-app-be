import {MongooseModule} from "@nestjs/mongoose";
import {CustomerSchema} from "./customer.schema";

export const CustomerModel = MongooseModule.forFeature([
  {name: "Customer", schema: CustomerSchema},
]);
