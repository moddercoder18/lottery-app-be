import * as mongoose from "mongoose";

import {Customer} from "./customer.interface";

export const CustomerSchema = new mongoose.Schema<Customer>(
  {
    name: { type: String, required: true},
    phoneNo: {type: String},
    provider: {type: String, default: "email"},
    profilePicture: {type: String},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, select: false},
    passwordResetToken: String,
    passwordResetExpires: Date,
    isActive: {type: Boolean, default: false},
    activationToken: String,
    activationExpires: Date,
    hasSubscription: {type: Boolean, default: false},
    isDelete: {type: Boolean, default: false},
    country: { type: String, },
    language: { type: String, default: 'en'}
  },
  {timestamps: true},
);

/**
 * Methods.
 */
CustomerSchema.methods.getPublicData = function () {
  const {_id, name, phoneNo, provider, profilePicture, email, isActive, hasSubscription, country, language} = this;
  return {_id, name, phoneNo, provider, profilePicture, email, isActive,  hasSubscription, country, language};
};
