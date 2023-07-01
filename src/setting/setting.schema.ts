import * as mongoose from "mongoose";

import { Setting } from "./setting.interface";

export const SettingSchema = new mongoose.Schema<Setting>(
  {
    setting: { serviceFee: { type: Number, default: 0},  referralCommission: { type: Number, default: 0}, referralDiscount: { type: Number, default: 0} , enableCustomerPickNumber: { type: Boolean, default: false}, megaMillionTicketPrice: { type: Number, default: 0}, megaMillionMultiplierPrice: { type: Number, default: 0}, powerMillionTicketPrice: { type: Number, default: 0}, powerMillionMultiplierPrice: { type: Number, default: 0}, lotteryAPIKey:  { type: String, default: ''} }
  },
  { timestamps: true },
);

/**
 * Methods.
 */
SettingSchema.methods.getPublicData = function () {
  const { _id, setting } = this;
  return { _id, setting };
};

