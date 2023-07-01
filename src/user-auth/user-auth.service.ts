import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { comparePassword, hashPassword } from "../common/auth";
import { UserService } from "../user/user.service";
import { User, UserType } from "../user/user.interface";
import { ErrorMessageException, LoginCredentialsException, UserNotFoundException } from "../common/exceptions";
import { ObjectId } from 'mongoose';
import {
  ActivateParams,
  ChangePasswordDto,
  ForgottenPasswordDto,
  ResetPasswordDto,
  CreateUserDto,
  UserUpdateDto,
} from "./user-auth.interface";
import { FileUploadService } from "../common/services/upload.service";
import config from "../config";

@Injectable()
export class UserAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    // if (!comparePassword(password, user.password)) {
    //   throw LoginCredentialsException();
    // }
    return user;
  }

  async validateUserById(id: ObjectId, password: string): Promise<User> {
    const user = await this.userService.findById(id, true);
    // if (!comparePassword(password, user.password)) {
    //   throw ErrorMessageException("Old Password does not match");
    // }
    return user;
  }

  async activate({ userId, activationToken }: ActivateParams) {
    const user = await this.userService.activate(userId, activationToken);
    return `
      Hi ${user.name},
      your account activate successfully
    `;
  }

  async login(user: User) {
    return {
      token: this.jwtService.sign({}, { subject: `${user.id}` }),
      user: user.getPublicData(),
    };
  }

  async createUser(adminUser: User, userData: CreateUserDto, profilePicture: Express.Multer.File | null) {
    let imageUrlObj: {
      profilePicture: string | undefined;
      password: string | undefined;
    } = {
      profilePicture: undefined,
      password: undefined
    };
    if (profilePicture && process.env.AWS_ACCESS_KEY_ID) {
      imageUrlObj.profilePicture = await this.fileUploadService.upload(
        profilePicture,
      );
    } else if (profilePicture) {
      imageUrlObj.profilePicture = `${config.apiUrl}/uploads/${profilePicture.filename}`;
    }
    const user = await this.userService.create(
      userData.email,
      userData.password,
      userData,
      adminUser
    );

    return {
      user: user.getPublicData(),
    };
  }

  async forgottenPassword({ email }: ForgottenPasswordDto) {
    return await this.userService.forgottenPassword(email);
  }

  async resetPassword({ passwordResetToken, password }: ResetPasswordDto) {
    const user = await this.userService.resetPassword(
      passwordResetToken,
      password,
    );

    return {
      message: "Reset password successfully"
    };
  }

  async changePassword({ oldPassword, newPassword }: ChangePasswordDto, userId: ObjectId) {
    await this.validateUserById(userId, oldPassword)
    const user = await this.userService.changePassword(
      oldPassword,
      newPassword,
      userId
    );
    return {
      token: this.jwtService.sign({}, { subject: `${user.id}` }),
      user: user.getPublicData(),
    };
  }

  async update(userId: ObjectId, userDto: UserUpdateDto) {
    const user = await this.userService.update(
      userId,
      userDto
    );
    return user;
  }

  async updateUserById(userDto: UserUpdateDto, _id: string, profilePicture: Express.Multer.File | null,) {
    let imageUrlObj: {
      profilePicture: string | undefined;
      password: string | undefined;
    } = {
      profilePicture: undefined,
      password: undefined
    };
    if (profilePicture && process.env.AWS_ACCESS_KEY_ID) {
      imageUrlObj.profilePicture = await this.fileUploadService.upload(
        profilePicture,
      );
    } else if (profilePicture) {
      imageUrlObj.profilePicture = `${config.apiUrl}/uploads/${profilePicture.filename}`;
    }
    if (userDto.password) {
      imageUrlObj.password = await hashPassword(userDto.password)
    }
    const user = await this.userService.update(_id as any,
      {
        ...userDto,
        ...imageUrlObj
      }
    )

    return user;
  }

  async updatePicture(
    userId: ObjectId,
    profilePicture: Express.Multer.File | null,
  ) {
    let imageUrlObj: {
      profilePicture: string | undefined;
    } = {
      profilePicture: undefined,
    };
    if (profilePicture && process.env.AWS_ACCESS_KEY_ID) {
      imageUrlObj.profilePicture = await this.fileUploadService.upload(
        profilePicture,
      );
    } else if (profilePicture) {
      imageUrlObj.profilePicture = `${config.apiUrl}/uploads/${profilePicture.filename}`;
    }
    const user = await this.userService.update(userId, JSON.parse(JSON.stringify(imageUrlObj)));
    return user;
  }

  async getUserProfile(user: User) {
    return {
      user: user.getPublicData(),
      token: this.jwtService.sign({}, { subject: `${user.id}` }),
    }
  }

  async getUserProfileById(userId: ObjectId) {
    const user = await this.userService.findById(userId)
    return {
      user: user.getPublicData()
    }
  }

  async findFieldAgents(user: User): Promise<User[]> {
    const fieldAgent = await this.userService.findFieldAgents()
    return fieldAgent
  }

  async findAllUsers(user: User): Promise<User[]> {
    const fieldAgent = await this.userService.findAllUsers()
    return fieldAgent
  }

  async deleteUser(id: string, user: User): Promise<User | null > {
    if (user.type !== UserType.SUPER_ADMIN) {
      throw ErrorMessageException("User unable to delete user");
    }
    const deletedUser = await this.userService.deleteUser(id);
    return deletedUser
  }

}
