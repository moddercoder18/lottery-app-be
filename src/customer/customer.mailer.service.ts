import { Injectable } from "@nestjs/common";
import { MailerService } from "@nest-modules/mailer";

import config from "../config";

@Injectable()
export class CustomerMailerService {
  constructor(private readonly mailerService: MailerService) { }

  sendActivationMail(
    email: string,
    customerId: string,
    activationToken: string,
    origin: string = config.apiUrl,
  ) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          from: 'admin@powermillions.com',
          to: email,
          subject: "Activate your account",
          html: `Please click on the following link, or paste this into your browser to activate your account:\n
${origin}/customer/activate/${customerId}/${activationToken}\n`,
        })
        .catch();
    }
  }

  sendForgottenPasswordMail(
    to: string,
    passwordResetToken: string,
    origin: string = config.websiteUrl,
  ) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          to,
          subject: "Reset your password",
          html: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n
Please click on the following link, or paste this into your browser to complete the process:\n
${origin}/password-reset-confirm/${passwordResetToken}/\n
If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        })
        .catch();
    }
  }

  sendResetPasswordMail(email: string) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          to: email,
          subject: "Your password has been changed",
          html: `Hello,\n\nThis is a confirmation that the password for your account ${email} has just been changed.\n`,
        })
        .catch();
    }
  }

  sendMailToCustomer(
    email: string,
    subject: string,
    template: string,
    attachments: any = []
  ) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          to: email,
          subject,
          html:template,
          attachments: attachments.map((file: any, i: any) => ({
            filename: `Scan Ticket ${i}.png`,
            path: file
          }))
        })
        .catch();
    }
  }
}
