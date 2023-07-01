import { Document, ObjectId } from "mongoose";

export type CustomerWalletPublicData = Readonly<{
  _id: ObjectId;
  amount: number;
  customerId: ObjectId;
  isActive: boolean;
  customerCurrency: string;
}>;

export type CustomerWalletMethods = {
  getPublicData: () => CustomerWalletPublicData;
};

export type CustomerWallet = Readonly<{
  id: ObjectId;
  amount: number;
  customerId: ObjectId;
  isActive: boolean;
  customerCurrency: string;
}> &
  CustomerWalletMethods &
  Document;
