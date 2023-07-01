import * as mongoose from "mongoose";

import {User, UserType} from "./user.interface";

export const UserSchema = new mongoose.Schema<User>(
  {
    name: { type: String, required: true },
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
    maxAssignedTicket: { type: Number, default: 0 },
    type: {
      type: String,
      enum : [UserType.SUPER_ADMIN, UserType.ADMIN, UserType.FIELD_AGENT],
    },
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
    isDelete: {type: Boolean, default: false},
  },
  {timestamps: true},
);

/**
 * Methods.
 */
UserSchema.methods.getPublicData = function () {
  const {_id, name, phoneNo, provider, profilePicture, email, isActive, type, isDelete, maxAssignedTicket} = this;
  return {_id, name, phoneNo, provider, profilePicture, email, isActive, type, isDelete, maxAssignedTicket};
};
