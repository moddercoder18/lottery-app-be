import { MongooseModule } from "@nestjs/mongoose";
import { LotterySchema } from "./lottery.schema";

export const LotteryModel = MongooseModule.forFeature([
  { name: "Lottery", schema: LotterySchema },
]);
