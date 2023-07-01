import * as mongoose from "mongoose";
import { PaymentType, Transaction, UserPaymentType } from "./transaction.interface";

export const TransactionSchema = new mongoose.Schema<Transaction>(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Customer" },
    customerTicketId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Customer" },
    lotteryId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Lottery" },
    paymentType: { type: String, default: PaymentType.PAYPAL },
    type: { type: String, default: UserPaymentType.ONE_TIME_ENTRY },
    status: { type: String, default: 'draft' },
    isActive: { type: Boolean, default: true },
    amount: { type: Number, default: 0 },
    amountInCustomerCurrency: { type: Number, default: 0 },
    response: { type: Object, default: null },
    orderId: { type: String, default: '' },
    multiDrawSelectedOption: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    subTotalTicketPrice: { type: Number, default: 0 },
    couponId:  { type: mongoose.Schema.Types.ObjectId, required: false, ref: "Coupon" },
    byWallet: { type: Number, default: 0 },
    walletTransactionId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: "CustomerWalletTransaction", default: null },
  },
  { timestamps: true },
);
/**
 * Methods.
 */
TransactionSchema.methods.getPublicData = function () {
  const { _id, customerId, lotteryId, paymentType, isActive } = this;
  return { _id, customerId, lotteryId, paymentType, isActive };
};
