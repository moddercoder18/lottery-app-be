import { Injectable } from "@nestjs/common";
import { MultiDrawOptions, PaymentType, Transaction, TransactionCreateDto, UserPaymentType, } from "./transaction.interface";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import { Customer } from "../customer/customer.interface";
import * as paypal from "paypal-rest-sdk";
import { CustomerTicketService } from "../customer-ticket/customer-ticket.service";
import { LotteryService } from "../lottery/lottery.service";
import { ErrorMessageException } from "../common/exceptions";
import { CouponService } from "../coupon/coupon.service";
import { SettingService } from "../setting/setting.service";
import { Coupon } from "../coupon/coupon.interface";
import { CustomerWalletTransactionService } from "../customer-wallet-transaction/customer-wallet-transaction.service";
import { TransactionType } from '../customer-wallet-transaction/customer-wallet-transaction.interface';
import { CustomerWalletService } from "../customer-wallet/customer-wallet.service";
const payPalBaseURL = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com"
};
@Injectable()
export class TransactionService {
  constructor(
    @InjectModel("Transaction") private readonly transactionModel: Model<Transaction>,
    private readonly httpService: HttpService,
    private readonly customerTicketService: CustomerTicketService, private readonly lotteryService: LotteryService,
    private readonly couponService: CouponService, private settingService: SettingService,
    private customerWalletTransactionService: CustomerWalletTransactionService, private readonly customerWalletService: CustomerWalletService
  ) { }

  async create(customer: Customer, transactionCreateDto: TransactionCreateDto) {
    let validateCoupon: {
      coupon: Coupon | null;
      message: string;
    } = {
      coupon: null,
      message: ''
    };
    const setting = await this.settingService.getAllData();
    const customerWallet = transactionCreateDto.hasWallet ? await this.customerWalletService.findCustomerWallet(customer._id) : null
    const customerTicket = await this.customerTicketService.create(customer, transactionCreateDto.customerTicket as any, setting.setting.enableCustomerPickNumber);
    if (!customerTicket) {
      throw ErrorMessageException("Customer unable to create customer-ticket in checkout");
    }
    const lottery = await this.lotteryService.findById(String(customerTicket.lotteryId));
    if (!lottery) {
      throw ErrorMessageException("Unable to find lottery in checkout");
    }
    if (transactionCreateDto.couponCode) {
      validateCoupon = await this.couponService.findByCode(transactionCreateDto.couponCode, customer._id);
      if (!validateCoupon.coupon && validateCoupon.message) {
        throw ErrorMessageException(validateCoupon.message);
      }
    }
    switch (transactionCreateDto.type) {
      case UserPaymentType.ONE_TIME_ENTRY: {
        const ticketLinePrice = customerTicket.hasMultiplier ? (lottery.ticketPricePerLine + lottery.multiplierPricePerLine) : lottery.ticketPricePerLine;
        const subTotalTicketPrice = ticketLinePrice * customerTicket.tickets.length;
        const serviceFee = subTotalTicketPrice * (setting.setting.serviceFee || 0)
        const discount = validateCoupon.coupon ? serviceFee * (setting.setting.referralDiscount / 100) : 0;
        const totalTicketPrice = subTotalTicketPrice + serviceFee - discount;
        const totalTicketPriceInCustomerCurrency = totalTicketPrice * (setting?.currency?.rates[transactionCreateDto.customerCurrency] || 1);
        const paymentType = customerWallet ? customerWallet.amount >= totalTicketPrice ? PaymentType.WALLET : PaymentType.PAYPAL_WITH_WALLET : PaymentType.PAYPAL;
        const byWallet = customerWallet ? customerWallet.amount >= totalTicketPrice ? totalTicketPrice : customerWallet.amount : 0;
        const transaction = await this.transactionModel.create({
          customerId: customer._id,
          lotteryId: lottery._id,
          isActive: true,
          paymentType,
          type: UserPaymentType.ONE_TIME_ENTRY,
          status: paymentType === PaymentType.WALLET ? 'purchased' : 'draft',
          amountInCustomerCurrency: totalTicketPriceInCustomerCurrency,
          discount,
          serviceFee,
          subTotalTicketPrice,
          amount: totalTicketPrice,
          customerTicketId: customerTicket?._id,
          couponId: transactionCreateDto.couponCode ? validateCoupon.coupon?._id : undefined,
          byWallet,
          orderId: byWallet === totalTicketPrice ? `Wallet_${new Date().getTime()}` : ''
        });
        if (byWallet === totalTicketPrice) {
          if (transaction.couponId) {
            await this.couponService.createUsedCoupon({
              customerId: transaction.customerId,
              couponId: transaction.couponId
            });
            const coupon = await this.couponService.getCouponById(transaction.couponId);
            if (setting.setting.referralCommission && coupon) {
              await this.customerWalletTransactionService.createWallerTransaction({
                lotteryId: transaction.lotteryId,
                customerId: coupon.customerId,
                transactionType: TransactionType.COMMISSION,
                amount: (setting.setting.referralCommission * Number(transaction.serviceFee)) / 100,
                customerTicketId: transaction.customerTicketId,
                isActive: true,
                customerCurrency: 'USD'
              })
            }
          }
          const customerWalletTransaction = await this.customerWalletTransactionService.createWallerTransaction({
            lotteryId: transaction.lotteryId,
            customerId: transaction.customerId,
            transactionType: TransactionType.PURCHASED,
            amount: byWallet,
            customerTicketId: transaction.customerTicketId,
            isActive: true,
            customerCurrency: 'USD'
          });
          await this.customerTicketService.updateTransactionId(customerTicket._id, transaction._id);
          const updateTransaction = await this.transactionModel.findByIdAndUpdate(transaction._id, {
            walletTransactionId: customerWalletTransaction._id
          }, {
            new: true
          })
          return updateTransaction;
        }
        await this.customerTicketService.updateTransactionId(customerTicket._id, transaction._id);
        const amountForPaypal = String(Number((totalTicketPrice - byWallet).toFixed(2)));
        try {
          const paypalOrderRequestBody = {
            intent: 'CAPTURE',
            'redirect_urls': {
              'return_url': `${process.env.API_URL}/transaction/paypal-success`,
              'cancel_url': `${process.env.API_URL}/transaction/paypal-cancel`
            },
            purchase_units: [
              {
                "reference_id": transaction._id,
                amount: {
                  currency_code: "USD", // transactionCreateDto.customerCurrency 
                  value: amountForPaypal
                },
                "payee": {
                  "email": "seller@example.com"
                },
              },
            ],
            metadata: {
              supplementary_data: [{
                "name": "transactionId",
                "value": transaction._id
              }, {
                "name": "customerId",
                "value": customer._id
              }, {
                "name": "lotteryId",
                "value": lottery._id
              }, {
                "name": "customerTicketId",
                "value": customerTicket._id
              }]
            },

          };
          const payPalOrder = await this.createPaypalOrder(paypalOrderRequestBody);
          const updatedTransaction = await this.transactionModel.findByIdAndUpdate(transaction._id, {
            status: 'order',
            orderId: payPalOrder?.data?.id,
            response: transaction.response ? {
              ...transaction.response,
              order: payPalOrder?.data
            } : {
              order: payPalOrder?.data
            }
          }, {
            new: true
          })
          return updatedTransaction;
        } catch (error: any) {
          console.log(`amountForPaypal`, amountForPaypal);
          throw ErrorMessageException(error?.message || error || 'Error while crating paypal payment');
        }
      }

      case UserPaymentType.MULTI_DRAW: {
        const ticketLinePrice = customerTicket.hasMultiplier ? (lottery.ticketPricePerLine + lottery.multiplierPricePerLine) : lottery.ticketPricePerLine;
        const totalTicketPrice = ticketLinePrice * customerTicket.tickets.length;
        const totalTicketWithSelectedDraw = totalTicketPrice * Number(transactionCreateDto.multiDrawSelectedOption);
        const totalTicketWithSelectedDrawWithDiscount = totalTicketWithSelectedDraw - ((totalTicketWithSelectedDraw * MultiDrawOptions[transactionCreateDto.multiDrawSelectedOption].off) / 100);
        const totalTicketPriceInCustomerCurrency = totalTicketWithSelectedDrawWithDiscount * setting.currency.rates[transactionCreateDto.customerCurrency];
        const transaction = await this.transactionModel.create({
          customerId: customer._id,
          lotteryId: lottery._id,
          isActive: true,
          paymentType: PaymentType.PAYPAL,
          type: UserPaymentType.MULTI_DRAW,
          status: 'draft',
          amountInCustomerCurrency: totalTicketPriceInCustomerCurrency,
          amount: totalTicketWithSelectedDrawWithDiscount,
          multiDrawSelectedOption: transactionCreateDto.multiDrawSelectedOption,
          customerTicketId: customerTicket._id
        });
        const customerTicketUpdated = await this.customerTicketService.updateTransactionId(customerTicket._id, transaction._id);
        const amountForPaypal = String(Number(totalTicketWithSelectedDrawWithDiscount.toFixed(2)));
        try {
          const paypalOrderRequestBody = {
            intent: 'CAPTURE',
            'redirect_urls': {
              'return_url': `${process.env.API_URL}/transaction/paypal-success`,
              'cancel_url': `${process.env.API_URL}/transaction/paypal-cancel`
            },
            purchase_units: [
              {
                "reference_id": transaction._id,
                amount: {
                  currency_code: "USD", // transactionCreateDto.customerCurrency 
                  value: amountForPaypal
                },
                "payee": {
                  "email": "seller@example.com"
                },
              },
            ],
            metadata: {
              supplementary_data: [{
                "name": "transactionId",
                "value": transaction._id
              }, {
                "name": "customerId",
                "value": customer._id
              }, {
                "name": "lotteryId",
                "value": lottery._id
              }, {
                "name": "customerTicketId",
                "value": customerTicket._id
              }]
            },

          };
          const payPalOrder = await this.createPaypalOrder(paypalOrderRequestBody);
          const updatedTransaction = await this.transactionModel.findByIdAndUpdate(transaction._id, {
            status: 'order',
            orderId: payPalOrder?.data?.id,
            response: transaction.response ? {
              ...transaction.response,
              order: payPalOrder?.data
            } : {
              order: payPalOrder?.data
            }
          }, {
            new: true
          })
          return updatedTransaction;
        } catch (error: any) {
          console.log(`amountForPaypal`, amountForPaypal);
          throw ErrorMessageException(error?.message || error || 'Error while crating paypal payment');
        }
      }

      case UserPaymentType.SUBSCRIPTION: {
        console.log(`${UserPaymentType.SUBSCRIPTION} Coming soon!`)
        return {
          success: true,
          message: `${UserPaymentType.SUBSCRIPTION} Coming soon!`
        }
      }
      default: {
        return {
          success: false,
          message: `No payment type found`
        }
      }
    }
  }

  private async _generatePaypalAccessToken() {
    const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET).toString("base64")
    const response = await this.httpService.post(`${payPalBaseURL[process.env.PAYPAL_MODE as 'live' | 'sandbox' || 'sandbox']}/v1/oauth2/token`, "grant_type=client_credentials", {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }).toPromise(); ``
    return response?.data?.access_token;
  }

  async capturePaypalPayment(orderId: string) {
    const accessToken = await this._generatePaypalAccessToken();
    const url = `${payPalBaseURL[process.env.PAYPAL_MODE as 'live' | 'sandbox' || 'sandbox']}/v2/checkout/orders/${orderId}/capture`;
    const response = await this.httpService.post(url, {}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }).toPromise();
    const transaction = await this.transactionModel.findOne({
      orderId
    });
    if (!transaction) {
      throw ErrorMessageException(`Not found transaction for order id ${orderId}`);
    }
    const setting = await this.settingService.getAllData();
    let updatedTransaction = await this.transactionModel.findByIdAndUpdate(transaction, {
      status: response?.data?.status === 'COMPLETED' ? 'purchased' : 'purchase-pending',
      response: transaction.response ? {
        ...transaction.response,
        capture: response?.data
      } : {
        capture: response?.data
      }
    }, {
      new: true
    })
    if (updatedTransaction) {
      await this.customerTicketService.update(updatedTransaction.customerTicketId, {
        status: updatedTransaction?.status === 'purchased' ? 'order' : updatedTransaction?.status
      });
      if (updatedTransaction.couponId) {
        await this.couponService.createUsedCoupon({
          customerId: updatedTransaction.customerId,
          couponId: updatedTransaction.couponId
        });
        const coupon = await this.couponService.getCouponById(updatedTransaction.couponId);
        if (setting.setting.referralCommission && coupon) {
          await this.customerWalletTransactionService.createWallerTransaction({
            lotteryId: updatedTransaction.lotteryId,
            customerId: coupon.customerId,
            transactionType: TransactionType.COMMISSION,
            amount: (setting.setting.referralCommission * Number(updatedTransaction.serviceFee)) / 100,
            customerTicketId: updatedTransaction.customerTicketId,
            isActive: true,
            customerCurrency: 'USD'
          })
        }
      }
      if (updatedTransaction.byWallet) {
        const customerWalletTransaction = await this.customerWalletTransactionService.createWallerTransaction({
          lotteryId: updatedTransaction.lotteryId,
          customerId: updatedTransaction.customerId,
          transactionType: TransactionType.PURCHASED,
          amount: updatedTransaction.byWallet,
          customerTicketId: updatedTransaction.customerTicketId,
          isActive: true,
          customerCurrency: 'USD'
        });
        updatedTransaction = await this.transactionModel.findByIdAndUpdate(updatedTransaction._id, {
          walletTransactionId: customerWalletTransaction._id
        }, {
          new: true
        })
      }
    }
    return updatedTransaction;
  }

  async createPaypalOrder(paymentJson: any) {
    const accessToken = await this._generatePaypalAccessToken();
    const url = `${payPalBaseURL[process.env.PAYPAL_MODE as 'live' | 'sandbox' || 'sandbox']}/v2/checkout/orders`;
    const response = await this.httpService.post(url, paymentJson, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      }
    }).toPromise();
    return response;
  }

  async paypalSuccessEvent(payerId: string, paymentId: string) {
    const executePaymentJson = {
      'payer_id': payerId
    };
    const response = await this.executePaypalPayment(paymentId, executePaymentJson)
    return response;
  }

  executePaypalPayment(paymentId: string, paymentJson: any) {
    return new Promise((resolve, reject) => {
      paypal.payment.execute(paymentId, paymentJson, (error, payment) => {
        if (error) {
          console.log('Paypal payment execute error ===>', error);
          reject(error.message);
        } else {
          console.log(JSON.stringify(payment));
          resolve({
            success: true
          });
        }
      });
    })
  }

  paypalCancelEvent(query: Record<string, any>) {
    console.log("Query parameters =======>", query)
    return {
      cancel: true
    }
  }

  async processPaypalWebhook(paypalRequestBody: any) {
    switch (paypalRequestBody.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        {
          const resource = paypalRequestBody?.resource
          const orderId = resource?.supplementary_data?.related_ids?.order_id;
          const setting = await this.settingService.getAllData();
          if (orderId) {
            const transaction = await this.transactionModel.findOne({
              orderId
            })
            if (!transaction) {
              throw ErrorMessageException(`Not able to find transaction for order id ${orderId}`)
            }
            if (resource?.final_capture && resource?.status === 'COMPLETED') {
              await this.transactionModel.findByIdAndUpdate(transaction._id, {
                $set: {
                  status: 'purchased',
                  response: transaction.response ? {
                    ...transaction.response,
                    captureWebhookEvent: paypalRequestBody
                  } : {
                    captureWebhookEvent: paypalRequestBody
                  }
                }
              }, {
                new: true
              });
              if (transaction.couponId) {
                await this.couponService.createUsedCoupon({
                  customerId: transaction.customerId,
                  couponId: transaction.couponId
                });
                const coupon = await this.couponService.getCouponById(transaction.couponId);
                if (setting.setting.referralCommission && coupon) {
                  await this.customerWalletTransactionService.createWallerTransaction({
                    lotteryId: transaction.lotteryId,
                    customerId: coupon.customerId,
                    transactionType: TransactionType.COMMISSION,
                    amount: (setting.setting.referralCommission * Number(transaction.serviceFee)) / 100,
                    customerTicketId: transaction.customerTicketId,
                    isActive: true,
                    customerCurrency: 'USD'
                  })
                }
                if (transaction.byWallet) {
                  const customerWalletTransaction = await this.customerWalletTransactionService.createWallerTransaction({
                    lotteryId: transaction.lotteryId,
                    customerId: transaction.customerId,
                    transactionType: TransactionType.PURCHASED,
                    amount: transaction.byWallet,
                    customerTicketId: transaction.customerTicketId,
                    isActive: true,
                    customerCurrency: 'USD'
                  });
                  await this.transactionModel.findByIdAndUpdate(transaction._id, {
                    walletTransactionId: customerWalletTransaction._id
                  }, {
                    new: true
                  })
                }
              }
              return await this.customerTicketService.update(transaction.customerTicketId, {
                status: 'order'
              });
            } else {
              await this.transactionModel.findByIdAndUpdate(transaction._id, {
                $set: {
                  status: 'purchase-pending',
                  response: transaction.response ? {
                    ...transaction.response,
                    captureWebhookEvent: paypalRequestBody
                  } : {
                    captureWebhookEvent: paypalRequestBody
                  }
                }
              }, {
                new: true
              });
              return;
              // return await this.customerTicketService.update(transaction.customerTicketId, {
              //   status: 'purchase-pending'
              // });
            }
          } else {
            throw ErrorMessageException(`Not able to find order in request body for id ${paypalRequestBody.id}`)
          }
        }
    
    }
    return {
      success: 'Not processed'
    }
  }

  async paymentViaWallet(customer: Customer, transactionCreateDto: TransactionCreateDto) {
    let validateCoupon: {
      coupon: Coupon | null;
      message: string;
    } = {
      coupon: null,
      message: ''
    };
    const lottery = await this.lotteryService.findById(String(transactionCreateDto.customerTicket.lotteryId));
    if (!lottery) {
      throw ErrorMessageException("Unable to find lottery in checkout");
    }
    if (transactionCreateDto.couponCode) {
      validateCoupon = await this.couponService.findByCode(transactionCreateDto.couponCode, customer._id);
      if (!validateCoupon.coupon && validateCoupon.message) {
        throw ErrorMessageException(validateCoupon.message);
      }
    }
    const customerWallet = transactionCreateDto.hasWallet ? await this.customerWalletService.findCustomerWallet(customer._id) : null;
    if (!customerWallet?.amount) {
      return false;
    }
    const setting = await this.settingService.getAllData();
    const ticketLinePrice = transactionCreateDto.customerTicket.hasMultiplier ? (lottery.ticketPricePerLine + lottery.multiplierPricePerLine) : lottery.ticketPricePerLine;
    const subTotalTicketPrice = ticketLinePrice * transactionCreateDto.customerTicket.tickets.length;
    const serviceFee = subTotalTicketPrice * (setting.setting.serviceFee || 0)
    const discount = validateCoupon.coupon ? serviceFee * (setting.setting.referralDiscount / 100) : 0;
    const totalTicketPrice = subTotalTicketPrice + serviceFee - discount;
    const totalTicketPriceInCustomerCurrency = totalTicketPrice * (setting?.currency?.rates[transactionCreateDto.customerCurrency] || 1);
    const byWallet = customerWallet ? customerWallet.amount >= totalTicketPrice ? totalTicketPrice : customerWallet.amount : 0;
    if (byWallet === totalTicketPrice) {
      const customerTicket = await this.customerTicketService.create(customer, transactionCreateDto.customerTicket as any, setting.setting.enableCustomerPickNumber);
      if (!customerTicket) {
        throw ErrorMessageException("Customer unable to create customer-ticket in checkout");
      }
      const transaction = await this.transactionModel.create({
        customerId: customer._id,
        lotteryId: lottery._id,
        isActive: true,
        paymentType: PaymentType.WALLET,
        type: UserPaymentType.ONE_TIME_ENTRY,
        status: 'purchased',
        amountInCustomerCurrency: totalTicketPriceInCustomerCurrency,
        discount,
        serviceFee,
        subTotalTicketPrice,
        amount: totalTicketPrice,
        customerTicketId: customerTicket?._id,
        couponId: transactionCreateDto.couponCode ? validateCoupon.coupon?._id : undefined,
        byWallet,
        orderId: `Wallet_${new Date().getTime()}`,

      });
      await this.customerTicketService.updateTransactionId(customerTicket._id, transaction._id);
      if (transaction.couponId) {
        await this.couponService.createUsedCoupon({
          customerId: transaction.customerId,
          couponId: transaction.couponId
        });
        const coupon = await this.couponService.getCouponById(transaction.couponId);
        if (setting.setting.referralCommission && coupon) {
          await this.customerWalletTransactionService.createWallerTransaction({
            lotteryId: transaction.lotteryId,
            customerId: coupon.customerId,
            transactionType: TransactionType.COMMISSION,
            amount: (setting.setting.referralCommission * Number(transaction.serviceFee)) / 100,
            customerTicketId: transaction.customerTicketId,
            isActive: true,
            customerCurrency: 'USD'
          })
        }
      }
      const customerWalletTransaction = await this.customerWalletTransactionService.createWallerTransaction({
        lotteryId: transaction.lotteryId,
        customerId: transaction.customerId,
        transactionType: TransactionType.PURCHASED,
        amount: byWallet,
        customerTicketId: transaction.customerTicketId,
        isActive: true,
        customerCurrency: 'USD'
      })
      const updateTransaction = await this.transactionModel.findByIdAndUpdate(transaction._id, {
        walletTransactionId: customerWalletTransaction._id
      }, {
        new: true
      })
      return !!updateTransaction;
    } else {
      return false
    }
  }
}