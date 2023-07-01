import { MongooseModule } from "@nestjs/mongoose";
import { SettingSchema } from "./setting.schema";

export const SettingModel = MongooseModule.forFeature([
  { name: "Setting", schema: SettingSchema },
]);
