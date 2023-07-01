import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { comparePassword } from "../common/auth";
import { CustomerService } from "../customer/customer.service";
import { CouponService } from "../coupon/coupon.service";
import { Customer } from "../customer/customer.interface";
import { ErrorMessageException, LoginCredentialsException, CustomerNotFoundException } from "../common/exceptions";
import { ObjectId } from 'mongoose';
import {
  ActivateParams,
  ChangePasswordDto,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
  CustomerUpdateDto,
} from "./customer-auth.interface";
import { FileUploadService } from "../common/services/upload.service";
import config from "../config";
import { CustomerWalletService } from "../customer-wallet/customer-wallet.service";
import { CustomerPhoneService } from "../customer/customer.phone.service";

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly customerService: CustomerService,
    private readonly couponService: CouponService,
    private readonly jwtService: JwtService,
    private readonly fileUploadService: FileUploadService,
    private readonly customerWalletService: CustomerWalletService,
    private readonly customerPhoneService: CustomerPhoneService
  ) { }

  async validateCustomer(email: string, password: string): Promise<Customer> {
    const customer = await this.customerService.findByEmail(email);

    if (!comparePassword(password, customer.password)) {
      throw LoginCredentialsException();
    }
    return customer;
  }

  async validateCustomerById(id: ObjectId, password: string): Promise<Customer> {
    const customer = await this.customerService.findById(id, true);
    if (!comparePassword(password, customer.password)) {
      throw ErrorMessageException("Old Password does not match");
    }
    return customer;
  }

  async activate({ customerId, activationToken }: ActivateParams) {
    const customer = await this.customerService.activate(customerId, activationToken);
    return `
      Hi ${customer.name},
      your account activate successfully
    `;
  }

  async login(customer: Customer) {
    const coupon =  await this.couponService.getCustomerCoupon(customer._id);
    return {
      token: this.jwtService.sign({}, { subject: `${customer.id}` }),
      customer: {
        ...customer.getPublicData(),
        wallet: await this.customerWalletService.findCustomerWallet(customer._id),
        coupon
      },
      
    };
  }

  async signUpCustomer(customerData: SignUpDto) {
    const customer = await this.customerService.create(
      customerData.email,
      customerData.password,
      customerData,
    );
    const coupon =  await this.couponService.getCustomerCoupon(customer._id)
    return {
      token: this.jwtService.sign({}, { subject: `${customer.id}` }),
      customer: {
        ...customer.getPublicData(),
        wallet: await this.customerWalletService.findCustomerWallet(customer._id),
        coupon
      },
    };
  }

  async forgottenPassword({ email }: ForgottenPasswordDto) {
    return await this.customerService.forgottenPassword(email);
  }

  async resetPassword({ passwordResetToken, password }: ResetPasswordDto) {
    const customer = await this.customerService.resetPassword(
      passwordResetToken,
      password,
    );

    return {
      message: "Reset password successfully"
    };
  }

  async changePassword({ oldPassword, newPassword }: ChangePasswordDto, customerId: ObjectId) {
    await this.validateCustomerById(customerId, oldPassword)
    const customer = await this.customerService.changePassword(
      oldPassword,
      newPassword,
      customerId
    );
    return {
      token: this.jwtService.sign({}, { subject: `${customer.id}` }),
      customer: {
        ...customer.getPublicData(),
        wallet: await this.customerWalletService.findCustomerWallet(customer._id)
      },
    };
  }

  async update(customerId: ObjectId, customerDto: CustomerUpdateDto) {
    const customer = await this.customerService.update(
      customerId,
      customerDto
    );
    return customer;
  }

  async updatePicture(
    customerId: ObjectId,
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
    const customer = await this.customerService.update(customerId, JSON.parse(JSON.stringify(imageUrlObj)));
    return customer;
  }

  async getCustomerProfile(customer: Customer) {
    const coupon =  await this.couponService.getCustomerCoupon(customer._id)
    return {
      customer: {
        ...customer.getPublicData(),
        wallet: await this.customerWalletService.findCustomerWallet(customer._id),
        coupon
      },
      token: this.jwtService.sign({}, { subject: `${customer.id}` })
    }
  }

  async getCustomerProfileById(customerId: ObjectId) {
    const customer = await this.customerService.findById(customerId)
    return {
      customer: {
        ...customer.getPublicData(),
        wallet: await this.customerWalletService.findCustomerWallet(customer._id)
      },
    }
  }

  async deleteUser(id: string): Promise<Customer | null > {
    const deletedUser = await this.customerService.deleteUser(id);
    return deletedUser
  }

  async resendActivationMail(customer: Customer) {
    await this.customerService.resendActivationMail(customer);
    return {
      success: true
    }
  }
}
