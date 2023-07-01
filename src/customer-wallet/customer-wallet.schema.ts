import * as mongoose from "mongoose";

import {CustomerWallet} from "./customer-wallet.interface";

export const CustomerWalletSchema = new mongoose.Schema<CustomerWallet>(
  {
    amount: {type: Number},
    isActive: {type: Boolean, default: true},
    customerId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "Customer" },
    customerCurrency: {type: String, default: "USD"}
    
  },
  {timestamps: true},
);

/**
 * Methods.
 */
CustomerWalletSchema.methods.getPublicData = function () {
  const {_id, amount, isActive, customerId, customerCurrency} = this;
  return {_id, amount, isActive, customerId, customerCurrency};
};
