import {Strategy} from "passport-local";
import {PassportStrategy} from "@nestjs/passport";
import {Injectable} from "@nestjs/common";

import {UserAuthService} from "./user-auth.service";
import {User} from "../user/user.interface";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "admin-user") {
  constructor(private readonly authService: UserAuthService) {
    super({
      usernameField: "email",
    });
  }

  async validate(email: string, password: string): Promise<User> {
    return await this.authService.validateUser(email, password);
  }
}
