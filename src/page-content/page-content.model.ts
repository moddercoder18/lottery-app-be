import {MongooseModule} from "@nestjs/mongoose";
import {PageContentSchema} from "./page-content.schema";

export const PageContentModel = MongooseModule.forFeature([
  {name: "PageContent", schema: PageContentSchema},
]);
