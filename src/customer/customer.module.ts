import {Module} from "@nestjs/common";

import {CustomerMailerService} from "./customer.mailer.service";
import {CustomerService} from "./customer.service";
import {CustomerModel} from "./customer.model";
import {CustomerPhoneService} from './customer.phone.service';
@Module({
  imports: [CustomerModel],
  providers: [CustomerMailerService, CustomerService, CustomerPhoneService],
  exports: [CustomerMailerService, CustomerService, CustomerPhoneService],
})
export class CustomerModule {}
