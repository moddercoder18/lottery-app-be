import { Model, ObjectId } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CustomerWallet } from "./customer-wallet.interface";


@Injectable()
export class CustomerWalletService {
  constructor(
    @InjectModel("CustomerWallet") private readonly customerWalletModel: Model<CustomerWallet>
  ) { }


  async findCustomerWallet(customerId: string | ObjectId): Promise<CustomerWallet> { // CustomerWallet & CardAmount
    const wallet = await this.customerWalletModel.findOne({
      customerId
    });
    if (!wallet) {
      const newWallet = await this.customerWalletModel.create({
        customerId,
        amount: 0,
        isActive: true,
      })
      return newWallet;
    }
    return wallet;
  }

  async findCustomerWallets(): Promise<CustomerWallet[]> {
    const wallets = await this.customerWalletModel.find({
      isActive: true
    }).populate({
      path: 'customerId',
      match: {
        isActive: true, isDelete: false
      }
    });
    return wallets.filter(({ customerId }) => !!customerId);;
  }

  async update(customerWalletDto: Partial<CustomerWallet>, customerId: ObjectId): Promise<any> { //CustomerWallet & CardAmount
    const cart = await this.customerWalletModel.findOne({
      customerId
    })
    if (cart) {
      const updatedCart = await this.customerWalletModel.findByIdAndUpdate(cart._id, {
        ...customerWalletDto,
        amount: cart.amount + Number(customerWalletDto.amount || 0)
      }, {
        new: true
      });
      if (updatedCart) {
        return updatedCart;
      } else {
        // Only fix for type issue
        const newWallet = await this.customerWalletModel.create({
          ...customerWalletDto,
          customerId
        });
        return newWallet;
      }
    } else {
      const newWallet = await this.customerWalletModel.create({
        ...customerWalletDto,
        customerId
      });
      return newWallet;
    }
  }
}