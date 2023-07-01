import * as mongoose from "mongoose";

import { CustomerTicket } from "./customer-ticket.interface";

export const CustomerTicketSchema = new mongoose.Schema<CustomerTicket>(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Customer" },
    tickets: [{ numbers: [{ type: Number }], powerNumbers: [{ type: Number }], isWinner: { type: Boolean, default: false }, matchedNumbers: [{ type: Number }], matchedPowerNumbers: [{ type: Number }], priceBreakdown: { number: { type: Number }, powerNumber: { type: Number }, price: { type: Number, default: 0 } }, walletTransactionId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: "CustomerWalletTransaction", default: null } }],
    lotteryId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Lottery" },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    agentScanTicket: [{ type: String }],
    agentTickets: [{ numbers: [{ type: Number }], powerNumbers: [{ type: Number }] }],
    isWinner: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    status: { type: String },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    type: { type: String, default: 'normal' },
    systematicNumber: { numbers: [{ type: Number }], powerNumbers: [{ type: Number }] },
    hasMultiplier: { type: Boolean, default: false },
    enableCustomerPickNumber: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true },
);

/**
 * Methods.
 */
CustomerTicketSchema.methods.getPublicData = function () {
  const { _id, customerId, tickets, lotteryId, agentId, agentScanTicket, agentTickets, isWinner, isActive, status, typeField, systematicNumber, transactionId } = this;
  return { _id, customerId, tickets, lotteryId, agentId, agentScanTicket, agentTickets, isWinner, isActive, status, typeField, systematicNumber, transactionId };
};
