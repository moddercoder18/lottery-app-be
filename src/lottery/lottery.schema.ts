import * as mongoose from "mongoose";

import { Lottery, LotteryType } from "./lottery.interface";

export const LotterySchema = new mongoose.Schema<Lottery>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String },
    isActive: { type: Boolean, default: true },
    image: { type: String },
    description: { type: String },
    winningPrice: { type: Number },
    type: { type: String, enum: [LotteryType.MegaMillions, LotteryType.PowerBall] },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    numbersPerLine: { totalShowNumber: { type: Number }, totalShowPowerNumber: { type: Number }, maxSelectTotalNumber: { type: Number }, maxSelectTotalPowerNumber: { type: Number } },
    winningNumbers: { numbers: [{ type: Number }], powerNumbers: [{ type: Number }] },
    ticketPricePerLine: { type: Number },
    multiplierPricePerLine: { type: Number },
    priceCurrency: { type: String, default: '$' },
    markAsComplete: { type: Boolean, default: false },
    markAsPublish: { type: Boolean, default: false },
    prizeBreakDown:  [{ number: { type: Number }, powerNumber: { type: Number }, price: { type: Number }  }],
    timeZone: { type: String, default: 'America/Chicago' },
    hasMultiDraw: { type: Boolean, default: false },
    multiDrawOptions: [{ value: { type: String }, label: { type: String } }],
    multiplier : { type: Number},
    ticketLines: { type: Number},
    backgroundColor: { type: String }
  },
  { timestamps: true },
);

/**
 * Methods.
 */
LotterySchema.methods.getPublicData = function () {
  const { userId, _id, name, isActive, image, description, winningPrice, type, startDate, endDate, numbersPerLine, winningNumbers, ticketPricePerLine, multiplierPricePerLine, priceCurrency, markAsComplete, markAsPublish, prizeBreakDown, timeZone, hasMultiDraw, multiDrawOptions, multiplier, ticketLines, backgroundColor } = this;
  return { userId, _id, name, isActive, image, description, winningPrice, type, startDate, endDate, numbersPerLine, winningNumbers, ticketPricePerLine, multiplierPricePerLine, priceCurrency, markAsComplete, markAsPublish, prizeBreakDown, timeZone, hasMultiDraw, multiDrawOptions, multiplier, ticketLines, backgroundColor };
};
