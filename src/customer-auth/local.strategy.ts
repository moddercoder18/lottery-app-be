import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

import { CustomerAuthService } from "./customer-auth.service";
import { Customer } from "../customer/customer.interface";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy,  "customer-user") {
  constructor(private readonly authService: CustomerAuthService) {
    super({
      usernameField: "email",
    });
  }

  async validate(email: string, password: string): Promise<Customer> {
    return await this.authService.validateCustomer(email, password);
  }
}
