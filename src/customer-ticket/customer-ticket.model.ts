import {MongooseModule} from "@nestjs/mongoose";
import {CustomerTicketSchema} from "./customer-ticket.schema";

export const CustomerTicketModel = MongooseModule.forFeature([
  {name: "CustomerTicket", schema: CustomerTicketSchema},
]);
