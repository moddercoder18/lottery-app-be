import {ExtractJwt, Strategy} from "passport-jwt";
import {PassportStrategy} from "@nestjs/passport";
import {Injectable} from "@nestjs/common";
import {CustomerService} from "../customer/customer.service";
import {Customer} from "../customer/customer.interface";
import { ObjectId } from 'mongoose';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy,  "customer-jwt") {
  constructor(private readonly customerService: CustomerService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: {sub: ObjectId}): Promise<Customer> {
    return await this.customerService.findById(payload.sub);
  }
}
