import * as path from "path";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerModule } from "@nest-modules/mailer";
import { ServeStaticMiddleware } from "@nest-middlewares/serve-static";
import { MorganModule } from "nest-morgan";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { GlobalAccessLogger } from "./common/accessLogger";
import { CustomerAuthModule } from "./customer-auth/customer-auth.module";
import { CustomerModule } from "./customer/customer.module";
import { TransactionModule } from "./transaction/transaction.module";
import { PageContentModule } from "./page-content/page-content.module";
import config from "./config";
import { LotteryModule } from "./lottery/lottery.module";
import { CustomerWalletModule } from "./customer-wallet/customer-wallet.module";
import { CustomerTicketModule } from "./customer-ticket/customer-ticket.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from 'path';
import { UserAuthModule } from "./user-auth/user-auth.module";
import { UserModule } from "./user/user.module";
import { SettingModule } from "./setting/setting.module";
import { CurrencyModule } from "./currency/currency.module";
import { CouponModule } from "./coupon/coupon.module";


import { ScheduleModule } from "@nestjs/schedule";
import { CustomerWalletTransactionModule } from "./customer-wallet-transaction/customer-wallet-transaction.module";
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    UserAuthModule,
    CustomerAuthModule,
    MorganModule,
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL!),
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: process.env.MAILGUN_TRANSPORT,
        defaults: {
          from: config.mail.from,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
          options: {
            strict: true,
          },
        }
      }),
    }),
    UserModule,
    CustomerModule,
    LotteryModule,
    CustomerWalletModule,
    CustomerTicketModule,
    TransactionModule,
    PageContentModule,
    CurrencyModule,
    SettingModule,
    CouponModule,
    CustomerWalletTransactionModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads'
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'payment'),
      serveRoot: '/payment'
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'admin'),
      serveRoot: '/admin'
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'web'),
      serveRoot: '/'
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'web'),
      serveRoot: '*'
    })
  ],
  providers: config.isTest() ? undefined : [GlobalAccessLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    ServeStaticMiddleware.configure(
      path.resolve(__dirname, "..", "public"),
      config.static,
    );
    ServeStaticMiddleware.configure(
      path.resolve(__dirname, "..", "uploads"),
      config.static,
    );
    consumer.apply(ServeStaticMiddleware).forRoutes("public");

    if (!config.isTest()) {
      consumer.apply(LoggerMiddleware).forRoutes("api");
    }
  }
}
