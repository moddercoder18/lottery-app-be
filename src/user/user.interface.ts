import { Document, ObjectId } from "mongoose";
export enum UserType {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  FIELD_AGENT = 'field-agent'
}
export type UserPublicData = Readonly<{
  _id: ObjectId;
  name: string;
  phoneNo: string;
  provider: string;
  profilePicture: string;
  email: string;
  isActive: boolean;
  type: string;
  userId: ObjectId
  isDelete: boolean;
  maxAssignedTicket: number;
}>;

export type UserMethods = {
  getPublicData: () => UserPublicData;
};

export type User = Readonly<{
  _id: ObjectId;
  name: string;
  phoneNo: string;
  provider: string;
  profilePicture: string;
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: string;
  isActive: boolean;
  activationExpires: string;
  activationToken: string;
  type: string;
  userId: ObjectId
  isDelete: boolean;
  maxAssignedTicket: number;
}> &
  UserMethods &
  Document;
