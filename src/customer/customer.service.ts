import {Model,ObjectId} from "mongoose";
import {v4 as uuid} from "uuid";
import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";

import config from "../config";
import {hashPassword} from "../common/auth";
import {
  CustomerNotFoundException,
  EmailAlreadyUsedException,
  PasswordResetTokenInvalidException,
  ActivationTokenInvalidException,
} from "../common/exceptions";

import {Customer} from "./customer.interface";
import {CustomerMailerService} from "./customer.mailer.service";

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel("Customer") private readonly customerModel: Model<Customer>,
    private readonly customerMailer: CustomerMailerService,
  ) {}
  /**
   * Creates customer and sends activation email.
   * @throws duplicate key error when
   */
  async create(
    email: string,
    password: string,
    customerData: Partial<Customer>,
  ): Promise<Customer> {
    try {
      const customer = await this.customerModel.create({
        ...customerData,
        email: email.toLowerCase(),
        password: await hashPassword(password),
        activationToken: uuid(),
        activationExpires: Date.now() + config.auth.activationExpireInMs,
      });

      this.customerMailer.sendActivationMail(
        customer.email,
        customer.id,
        customer.activationToken,
      );
      return customer;
    } catch (error) {
      throw EmailAlreadyUsedException();
    }
  }

  async findById(id: ObjectId, hashPassword: boolean = false): Promise<Customer> {
    const customer = await this.customerModel.findById(id, hashPassword ? "+password" : "");

    if (!customer) {
      throw CustomerNotFoundException();
    }

    return customer;
  }


  async findByEmail(email: string): Promise<Customer> {
    const customer = await this.customerModel.findOne(
      {email: email.toLowerCase()},
      "+password",
    );

    if (!customer) {
      throw CustomerNotFoundException();
    }

    return customer;
  }

  async activate(customerId: string, activationToken: string) {
    const customer = await this.customerModel
      .findOneAndUpdate(
        {
          _id: customerId,
          activationToken,
          isActive: false,
        },
        {
          isActive: true,
          activationToken: undefined,
          activationExpires: undefined,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .where("activationExpires")
      .gt(Date.now())
      .exec();

    if (!customer) {
      throw ActivationTokenInvalidException();
    }
    return customer;
  }

  async forgottenPassword(email: string) {
    const customer = await this.customerModel.findOneAndUpdate(
      {
        email: email.toLowerCase(),
      },
      {
        passwordResetToken: uuid(),
        passwordResetExpires: Date.now() + config.auth.passwordResetExpireInMs,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!customer) {
      throw CustomerNotFoundException();
    }

    this.customerMailer.sendForgottenPasswordMail(
      customer.email,
      customer.passwordResetToken,
    );
    return {
      message: "Please check your email for reset password"
    }
  }

  async resetPassword(
    passwordResetToken: string,
    password: string,
  ) {
    const customer = await this.customerModel
      .findOneAndUpdate(
        {
          passwordResetToken,
        },
        {
          password: await hashPassword(password),
          passwordResetToken: null,
          passwordResetExpires: null,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .where("passwordResetExpires")
      .gt(Date.now())
      .exec();

    if (!customer) {
      throw PasswordResetTokenInvalidException();
    }

    this.customerMailer.sendResetPasswordMail(customer.email);

    return customer;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
    customerId: ObjectId
  ) {
    const customer = await this.customerModel
      .findByIdAndUpdate(
        customerId,
        {
          password: await hashPassword(newPassword),
          passwordResetToken: null,
          passwordResetExpires: null,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!customer) {
      throw CustomerNotFoundException();
    }
    this.customerMailer.sendResetPasswordMail(customer.email);
    return customer;
  }

  async update(id: ObjectId, updateDto: Partial<Customer>): Promise<Customer> {
    try {
      const oldCustomer = await this.customerModel.findById(id);
      const customer = await this.customerModel.findByIdAndUpdate(
        id,
        {
          ...updateDto,
          ...(oldCustomer?.email !== updateDto?.email
            ? {
                activationToken: uuid(),
                activationExpires:
                  Date.now() + config.auth.activationExpireInMs,
              }
            : {}),
        },
        {
          new: true,
          runValidators: true,
        },
      );
      if (!customer) {
        throw CustomerNotFoundException();
      }
      if (oldCustomer?.email !== updateDto?.email && updateDto?.email) {
        this.customerMailer.sendActivationMail(
          customer.email,
          customer.id,
          customer.activationToken,
        );
      }
      return customer;
    } catch (error) {
      throw EmailAlreadyUsedException();
    }
  }

  async deleteUser(id: string) {
    const user = await this.customerModel.findById(id);
    const email = user?.email?.replace('@', `${new Date().getTime()}@`);
    return this.customerModel.findByIdAndUpdate(id, {
      isDelete: true,
      email
    })
  }

  async resendActivationMail(loggedInUser: Customer) {
    const user = await this.customerModel.findByIdAndUpdate(loggedInUser._id, {
      activationToken: uuid(),
      activationExpires: Date.now() + config.auth.activationExpireInMs,
    }, {
      new: true
    })
    if (user) {
      this.customerMailer.sendActivationMail(
        user.email,
        user.id,
        user.activationToken,
      );
    }
  }

  async findAll() {
    return this.customerModel.find({
      isDelete: false, isActive: true
    })
  }
}
