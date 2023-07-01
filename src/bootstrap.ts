import helmet from "helmet";
import * as compression from "compression";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";

import { setupSwaggerDocuments } from "./common/swagger";
import { AppModule } from "./app.module";
import config from "./config";
import * as paypal from "paypal-rest-sdk";

/**
 * Helper to be used here & in tests.
 * @param app
 */
export const configureApp = (app: any) => {
  if (config.cors) {
    app.enableCors(config.cors);
  }
  // comment for load swagger ui in http schema
  //app.use(helmet());
  app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  paypal.configure({
    'mode': process.env.PAYPAL_MODE as string, //sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_ID as string,
    'client_secret': process.env.PAYPAL_SECRET as string,
  });
};

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  setupSwaggerDocuments(app);

  await app.listen(process.env.PORT!);
}
