import * as mongoose from "mongoose";

import {CustomerWalletTransaction} from "./customer-wallet-transaction.interface";

export const CustomerWalletTransactionSchema = new mongoose.Schema<CustomerWalletTransaction>(
  {
    amount: {type: Number},
    isActive: {type: Boolean, default: true},
    customerId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "Customer" },
    lotteryId: {type: mongoose.Schema.Types.ObjectId, required: false, ref: "Lottery" },
    customerTicketId: {type: mongoose.Schema.Types.ObjectId, required: false, ref: "CustomerTicket" },
    customerCurrency: {type: String, default: "USD"},
    transactionType: {type: String},
    isGivenByCash: { type: Boolean, default: false },
    cashStatus: { type: String },
    notes: { type: String },
    ticketInformation: { numbers: [{ type: Number }], powerNumbers: [{ type: Number }], isWinner: { type: Boolean, default: false }, matchedNumbers: [{ type: Number }], matchedPowerNumbers: [{ type: Number }], priceBreakdown: { number: { type: Number }, powerNumber: { type: Number }, price: { type: Number, default: 0 } } }
  },
  {timestamps: true},
);

/**
 * Methods.
 */
CustomerWalletTransactionSchema.methods.getPublicData = function () {
  const {_id, amount, isActive, customerId, customerCurrency, customerTicketId, lotteryId, transactionType} = this;
  return {_id, amount, isActive, customerId, customerCurrency, customerTicketId, lotteryId, transactionType };
};
