import * as mongoose from "mongoose";
import { Currency } from "./currency.interface";

export const CurrencySchema = new mongoose.Schema<Currency>(
  {
    baseCurrency: { type: String, required: true },
    date: { type: Date, default: Date.now },
    rates: {
      type: Object, default: {}
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/**
 * Methods.
 */
CurrencySchema.methods.getPublicData = function () {
  const { _id, baseCurrency, date, rates } = this;
  return { _id, baseCurrency, date, rates };
};
