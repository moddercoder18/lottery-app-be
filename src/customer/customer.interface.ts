import { Document, ObjectId } from "mongoose";

export type CustomerPublicData = Readonly<{
  _id: ObjectId;
  name: string;
  phoneNo: string;
  provider: string;
  profilePicture: string;
  email: string;
  isActive: boolean;
  hasSubscription: boolean;
  isDelete: boolean;
  country: string;
  language: string;
}>;

export type CustomerMethods = {
  getPublicData: () => CustomerPublicData;
};

export type Customer = Readonly<{
  _id: ObjectId;
  name: string;
  phoneNo: string;
  provider: string;
  profilePicture: string;
  email: string;
  password: string;
  country: string;
  passwordResetToken: string;
  passwordResetExpires: string;
  isActive: boolean;
  activationExpires: string;
  activationToken: string;
  hasSubscription: boolean;
  isDelete: boolean;
  language: string;
}> &
  CustomerMethods &
  Document;
