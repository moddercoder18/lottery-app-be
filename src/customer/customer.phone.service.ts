


import { Injectable } from "@nestjs/common";
import config from "../config";

const twilio = require('twilio');
@Injectable()
export class CustomerPhoneService {
    constructor() { }

    sendSmsToCustomer(
         to: string, body: string
    ) {
        const accountSid = process.env.TWILIO_ACCOUNTS_ID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);
        client.messages
            .create({
                body,
                from: '+918952988681',
                to: to
            })
            .then((message: any) => console.log(message.sid))

    }
}
