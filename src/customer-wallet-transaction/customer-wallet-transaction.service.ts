import { Model, ObjectId } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CashRequestApproveRejectDto, CustomerWalletTransaction, TransactionType } from "./customer-wallet-transaction.interface";
import { CustomerWalletService } from "../customer-wallet/customer-wallet.service";


@Injectable()
export class CustomerWalletTransactionService {
  constructor(
    @InjectModel("CustomerWalletTransaction") private readonly customerWalletModel: Model<CustomerWalletTransaction>,
    private readonly customerWallerService: CustomerWalletService
  ) { }


  async findCustomerWalletTransactions(customerId: string | ObjectId): Promise<CustomerWalletTransaction[]> {
    const walletTransactions = await this.customerWalletModel.find({
      customerId
    });

    return walletTransactions;
  }

  async createWallerTransaction(customerWalletTransaction: Partial<CustomerWalletTransaction>) {
    const customerWalletTransactionC = await this.customerWalletModel.create(customerWalletTransaction);
    let amount = customerWalletTransaction.amount;
    if (customerWalletTransaction.amount && (customerWalletTransaction.transactionType === TransactionType.PURCHASED ||
      customerWalletTransaction.transactionType === TransactionType.WITHDRAWAL)) {
      amount = -customerWalletTransaction.amount;
    }
    if (customerWalletTransactionC.isGivenByCash) {
      return customerWalletTransactionC;
    }
    await this.customerWallerService.update({
      amount,
      customerId: customerWalletTransaction.customerId,
      isActive: true,
      customerCurrency: 'USD'
    }, customerWalletTransaction.customerId as unknown as any);
    return customerWalletTransactionC;
  }


  async findCustomerCashRequests(): Promise<CustomerWalletTransaction[]> {
    const walletTransactions = await this.customerWalletModel.find({
      isActive: true,
      isGivenByCash: true,
      cashStatus: 'pending'
    }).populate({
      path: 'customerId',
      match: {  isActive: true, isDelete: false }
    });
    return walletTransactions.filter(({ customerId }) => !!customerId);
  }

  async updateCustomerCashRequestById(id: ObjectId, cashRequestApproveRejectDto: CashRequestApproveRejectDto): Promise<CustomerWalletTransaction | null> {
    const walletTransactions = await this.customerWalletModel.findByIdAndUpdate(id, {
      isActive: true,
      isGivenByCash: true,
      cashStatus: cashRequestApproveRejectDto.cashStatus,
      notes: cashRequestApproveRejectDto.notes
    }).populate({
      path: 'customerId',
      match: {  isActive: true, isDelete: false }
    });
    return walletTransactions;
  }
}