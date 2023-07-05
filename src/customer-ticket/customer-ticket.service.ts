import { Model, ObjectId } from "mongoose";
import { ConflictException, Injectable, StreamableFile } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { AgentCustomerTicketDto, AgentTicket, CustomerTicket, SystematicNumberObject, Ticket } from "./customer-ticket.interface";
import { ErrorMessageException } from "../common/exceptions";
import { FileUploadService } from "../common/services/upload.service";
import config from "../config";
import { Customer } from "../customer/customer.interface";
import { User, UserType } from "../user/user.interface";
import { Lottery, LotteryType } from "../lottery/lottery.interface";
import { LotteryService } from "../lottery/lottery.service";
import { HttpService } from "@nestjs/axios";
import * as FormData from 'form-data';
import * as fs from 'fs';
import { CustomerWalletTransactionService } from "../customer-wallet-transaction/customer-wallet-transaction.service";
import { TransactionType } from "../customer-wallet-transaction/customer-wallet-transaction.interface";
import { PageContentService } from "../page-content/page-content.service";
import { SettingService } from "../setting/setting.service";
import { CustomerMailerService } from "../customer/customer.mailer.service";
import { CustomerPhoneService } from "../customer/customer.phone.service";
import { CustomerService } from "../customer/customer.service";
import { UserService } from "../user/user.service";

@Injectable()
export class CustomerTicketService {
  constructor(
    @InjectModel("CustomerTicket") private readonly customerTicketModel: Model<CustomerTicket>,
    private readonly fileUploadService: FileUploadService, private lotteryService: LotteryService,
    private readonly httpService: HttpService, private readonly customerWalletTransactionService: CustomerWalletTransactionService,
    private readonly pageContentService: PageContentService, private readonly settingService: SettingService, private readonly customerMailerService: CustomerMailerService,
    private readonly customerService: CustomerService, private readonly customerPhoneService: CustomerPhoneService,
    private readonly userService: UserService
  ) { }

  async getCustomerTickets(customer: Customer): Promise<CustomerTicket[]> {
    const customerTicket = await this.customerTicketModel
      .find({
        customerId: customer._id,
        status: {
          $nin: ["draft"]
        }
      }).sort({
        'createdAt': -1
      }).populate({
        path: 'lotteryId transactionId',
        match: { status: { $nin: ["draft", "order"] } }
      })
    return customerTicket.filter(({ transactionId, lotteryId }) => !!transactionId && !!lotteryId);
  }

  async getCustomerTicketById(id: any, customer: Customer) {
    const customerTicket = await this.customerTicketModel
      .findById(id).sort({
        'createdAt': -1
      }).populate({
        path: 'lotteryId transactionId'
      })
    return customerTicket;
  }

  async getAssignedTicketsToAgent(agent: User): Promise<CustomerTicket[]> {
    const currentLottery = await this.lotteryService.getActiveLotteries('America/Los_Angeles', [LotteryType.MegaMillions, LotteryType.PowerBall]);
    const assignedAgentTicket = await this.customerTicketModel
      .find({
        agentId: agent._id,
        isActive: true,
        status: {
          $in: ["assigned", "purchasing-physical-ticket"]
        },
        ...(currentLottery.length ? {
          lotteryId: {
            $in: currentLottery.map(({ _id }) => _id)
          }
        }: {

        }),
      }).populate({
        path: 'lotteryId customerId',
        select: {
          name: 1, _id: 1, image: 1, profilePicture: 1, type: 1, numbersPerLine: 1,
        }
      }).select({
        customerId: 1,
        tickets: 1,
        lotteryId: 1,
        agentId: 1,
        agentScanTicket: 1,
        agentTickets: 1,
        isWinner: 1,
        isActive: 1,
        status: 1,
        transactionId: 1,
        type: 1,
      })
    return assignedAgentTicket;
  }

  async updateTransactionId(
    _id: string,
    transactionId: ObjectId
  ): Promise<CustomerTicket | null> {
    const customerTicket = await this.customerTicketModel.findByIdAndUpdate(_id, {
      transactionId
    },
      {
        new: true
      }
    );
    return customerTicket;
  }

  async getAllTicketsForAdmin(filters: {
    status: string,
    startDate: Date, endDate: Date, lotteryType: LotteryType, agentId: ObjectId
  }): Promise<CustomerTicket[]> {
    const currentLottery = await this.lotteryService.getActiveLotteries('America/Los_Angeles', [filters.lotteryType]);
    
    const customerTickets = await this.customerTicketModel
      .find({
        isActive: true,
        ...(currentLottery.length ? {
          lotteryId: {
            $in: currentLottery.map(({ _id }) => _id)
          }
        }: {

        }),
        ...(filters.status ? { status: filters.status } : {
          status: {
            $nin: ["draft"]
          }
        }),
        ...(filters.agentId ? { agentId: filters.agentId } : {}),
        // ...(filters.startDate && filters.endDate ? {
        //   startDate: {
        //     $gte: filters.startDate,
        //   }, endDate: {
        //     $lte: filters.endDate
        //   }
        // } : filters.startDate ? {
        //   startDate: {
        //     $gte: filters.startDate,
        //   }
        // } : filters.endDate ? {
        //   endDate: {
        //     $lte: filters.endDate
        //   }
        // } : {})
      }).sort({
        'createdAt': -1
      }).populate([{
        path: 'customerId'
      },
      {
        path: 'lotteryId',
        match: {
          ...(filters.lotteryType ? {
            type: filters.lotteryType
          } : {}),
        }
      },
      {
        path: 'transactionId',
        match: { status: { $nin: ["draft", "order"] } }
      }])

    return customerTickets.filter(({ transactionId, lotteryId }) => !!transactionId && !!lotteryId);;
  }

  fact(num: number) {
    if (num < 0) {
      return -1;
    } else if (num == 0) {
      return 1;
    } else {
      let result = 1;
      for (var i = num; i > 1; i--) {
        result *= i;
      }
      return result;
    }
  }

  maxNumberOfCombinations(n: number, r: number) {
    const lines = this.fact(n) / (this.fact(r) * this.fact(n - r));
    return lines;
  }

  generateCombinations(ticket: Ticket, comboLength: number) {
    const sourceLength = ticket.numbers.length;
    if (comboLength > sourceLength) return [];
    const combos: Ticket[] = []; // Stores valid combinations as they are generated.
    // Accepts a partial combination, an index into sourceArray, 
    // and the number of elements required to be added to create a full-length combination.
    // Called recursively to build combinations, adding subsequent elements at each call depth.
    const makeNextCombos = (workingCombo: number[], currentIndex: number, remainingCount: number) => {
      const oneAwayFromComboLength = remainingCount == 1;
      // For each element that remaines to be added to the working combination.
      for (let sourceIndex = currentIndex; sourceIndex < sourceLength; sourceIndex++) {
        // Get next (possibly partial) combination.
        const next: number[] = [...workingCombo, ticket.numbers[sourceIndex]];

        if (oneAwayFromComboLength) {
          // Combo of right length found, save it.
          combos.push({
            numbers: next,
            powerNumbers: ticket.powerNumbers
          });
        }
        else {
          // Otherwise go deeper to add more elements to the current partial combination.
          makeNextCombos(next, sourceIndex + 1, remainingCount - 1);
        }
      }
    }

    makeNextCombos([], 0, comboLength);
    return combos;
  }

  async create(
    customer: Customer,
    createCustomerTicketDto: Partial<CustomerTicket>,
    featureEnable: boolean = false,
  ):
    Promise<CustomerTicket> {
    if (!customer.isActive) {
      throw ErrorMessageException("Customer unable to create customer-ticket");
    }
    if (featureEnable) {
      this.validateDto(createCustomerTicketDto);
    }
    let tickets: Ticket[] = featureEnable ? (createCustomerTicketDto.tickets || []) : new Array(createCustomerTicketDto.tickets?.length || 0).fill({
      numbers: [], powerNumbers: []
    });
    const lottery = await this.lotteryService.findById(createCustomerTicketDto?.lotteryId?.toString())
    if (createCustomerTicketDto.systematicNumber?.numbers?.length && featureEnable) {
      tickets = this.generateCombinations(createCustomerTicketDto.systematicNumber, lottery.numbersPerLine.maxSelectTotalNumber);
    }
    const customerTicket = await this.customerTicketModel.create({
      ...createCustomerTicketDto,
      status: 'draft',
      customerId: customer._id,
      tickets,
      enableCustomerPickNumber: featureEnable
    });
    return customerTicket;
  }

  async readTextFromImage(user: User, medias: Array<Express.Multer.File>, lotteryId: string): Promise<any> {
    const images: string[] = [];
    const lottery = await this.lotteryService.findById(lotteryId);
    if (!lottery) {
      throw ErrorMessageException("Unable to find lottery");
    }
    for (const media of medias) {
      if (media && process.env.AWS_ACCESS_KEY_ID) {
        const url = await this.fileUploadService.upload(media);
        images.push(url);
      } else if (media) {
        const url = `${config.apiUrl}/uploads/${media.filename}`;
        images.push(url);
      }
    }
    const data = new FormData();
    data.append('urls', images[0])
    // data.append('file',fetchImage?.data);
    const response = await this.httpService.post(`https://app.nanonets.com/api/v2/OCR/Model/c980be77-d1ca-4bee-b6a2-f8ba37221550/LabelFile/?async=false`, data, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from("332a7a94-0501-11ee-b901-ce5295a60849" + ":").toString('base64'),
        ...data.getHeaders()
      },
    }).toPromise();
    const tickets: any = {};
    // const response = {"data":{"message":"Success","result":[{"message":"Success","input":"1686124464597_blob","prediction":[{"id":"bc3963ae-856f-4e45-a50a-28b23a31543c","label":"table","xmin":-2,"ymin":5,"xmax":487,"ymax":226,"score":1,"ocr_text":"table","type":"table","cells":[{"id":"0252e999-6225-4e18-84ad-237f93cfb864","row":1,"col":1,"row_span":1,"col_span":1,"label":"","xmin":0,"ymin":5,"xmax":60,"ymax":48,"score":0.58154297,"text":"10","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"50b06b19-4f72-4024-84e4-2e2cef9e5ab3","row":1,"col":2,"row_span":1,"col_span":1,"label":"","xmin":58,"ymin":6,"xmax":132,"ymax":50,"score":0.55322266,"text":"18","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"56ea5eaf-40e6-440e-9373-f823a0545d62","row":1,"col":3,"row_span":1,"col_span":1,"label":"","xmin":130,"ymin":8,"xmax":204,"ymax":51,"score":0.52197266,"text":"22","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"6347078c-834f-4321-8d3d-e146c1703789","row":1,"col":4,"row_span":1,"col_span":1,"label":"","xmin":202,"ymin":9,"xmax":276,"ymax":53,"score":0.44067383,"text":"37","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"c2e06079-39f3-460d-943c-0027508c5120","row":1,"col":5,"row_span":1,"col_span":1,"label":"","xmin":274,"ymin":11,"xmax":387,"ymax":55,"score":0.38256836,"text":"65 OP QP","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"f4c1fccf-c0b4-4b8a-a928-2183ca01796b","row":1,"col":6,"row_span":1,"col_span":1,"label":"","xmin":386,"ymin":14,"xmax":487,"ymax":57,"score":0.6298828,"text":"08 ОР","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"16667c1d-c5b2-4e49-b437-efb4f2a0744a","row":2,"col":1,"row_span":1,"col_span":1,"label":"","xmin":-1,"ymin":47,"xmax":59,"ymax":91,"score":0.5522461,"text":"02","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"4f4a5cc8-d5c7-40c1-89ea-4d3c3bee8f72","row":2,"col":2,"row_span":1,"col_span":1,"label":"","xmin":58,"ymin":48,"xmax":131,"ymax":93,"score":0.5258789,"text":"45","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"ca79389d-ac4c-40cb-bfd6-85792d1c6020","row":2,"col":3,"row_span":1,"col_span":1,"label":"","xmin":130,"ymin":50,"xmax":203,"ymax":94,"score":0.49609375,"text":"49","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"f7a6ef63-c1c5-4c61-ba39-c3ad845b3e4c","row":2,"col":4,"row_span":1,"col_span":1,"label":"","xmin":202,"ymin":50,"xmax":275,"ymax":96,"score":0.41870117,"text":"58","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"99b14568-db23-4416-9946-579fb1d81b56","row":2,"col":5,"row_span":1,"col_span":1,"label":"","xmin":274,"ymin":52,"xmax":387,"ymax":99,"score":0.3635254,"text":"63 ор ОР","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"8b0a6d04-e85b-4a1f-9aa1-d954bcf452cc","row":2,"col":6,"row_span":1,"col_span":1,"label":"","xmin":385,"ymin":55,"xmax":487,"ymax":101,"score":0.5986328,"text":"05 ор QP","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"7be42037-67f3-4115-963e-99632fa7e3a2","row":3,"col":1,"row_span":1,"col_span":1,"label":"","xmin":-1,"ymin":90,"xmax":59,"ymax":134,"score":0.5546875,"text":"13","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"b1fbc6c9-fd8a-4eb7-a7e9-45a7e5897286","row":3,"col":2,"row_span":1,"col_span":1,"label":"","xmin":57,"ymin":91,"xmax":131,"ymax":136,"score":0.5283203,"text":"18","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"6a8c2ecc-8796-43ef-a288-0c4ef5f551a5","row":3,"col":3,"row_span":1,"col_span":1,"label":"","xmin":129,"ymin":93,"xmax":203,"ymax":137,"score":0.49829102,"text":"39","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"e2b0473c-4a1e-4eba-bdab-0b9e86a232f1","row":3,"col":4,"row_span":1,"col_span":1,"label":"","xmin":201,"ymin":94,"xmax":275,"ymax":139,"score":0.4206543,"text":"40","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"1c8369a6-e058-443d-9b48-f2bd872c4c7e","row":3,"col":5,"row_span":1,"col_span":1,"label":"","xmin":273,"ymin":96,"xmax":386,"ymax":142,"score":0.36523438,"text":"50 ap ОР","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"8061087d-114d-4672-b558-02e2e3e230af","row":3,"col":6,"row_span":1,"col_span":1,"label":"","xmin":385,"ymin":98,"xmax":486,"ymax":144,"score":0.6010742,"text":"07 OP","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"5d8c8bbd-f1b7-48d9-9cc8-47da6daa64b6","row":4,"col":1,"row_span":1,"col_span":1,"label":"","xmin":-2,"ymin":133,"xmax":58,"ymax":177,"score":0.55078125,"text":"14","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"c36eb220-2333-4735-8922-0321a1fd5e9f","row":4,"col":2,"row_span":1,"col_span":1,"label":"","xmin":57,"ymin":134,"xmax":130,"ymax":179,"score":0.52441406,"text":"16","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"04544aa1-460f-481d-a290-591f7b178a3c","row":4,"col":3,"row_span":1,"col_span":1,"label":"","xmin":129,"ymin":136,"xmax":202,"ymax":180,"score":0.4946289,"text":"28","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"2fb79e23-0f6c-4bd5-bae7-b70c87aa4154","row":4,"col":4,"row_span":1,"col_span":1,"label":"","xmin":201,"ymin":137,"xmax":275,"ymax":181,"score":0.41748047,"text":"40","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"78aa38fa-c732-41d3-b815-705842232e3d","row":4,"col":5,"row_span":1,"col_span":1,"label":"","xmin":273,"ymin":139,"xmax":386,"ymax":184,"score":0.36254883,"text":"60 ар QP","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"b3cf8e5d-dfd6-4472-8fc4-ec4dde778ef7","row":4,"col":6,"row_span":1,"col_span":1,"label":"","xmin":384,"ymin":142,"xmax":486,"ymax":186,"score":0.5966797,"text":"08 OP ОР","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"240baf95-b0cc-4ede-a4fc-6aa89a71fd2f","row":5,"col":1,"row_span":1,"col_span":1,"label":"","xmin":-2,"ymin":176,"xmax":58,"ymax":216,"score":0.5805664,"text":"06","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"368a3580-8c25-4a50-99df-2add88afb84c","row":5,"col":2,"row_span":1,"col_span":1,"label":"","xmin":56,"ymin":177,"xmax":130,"ymax":218,"score":0.5522461,"text":"07","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"d8511141-3b5f-4593-8c0e-6094341961b8","row":5,"col":3,"row_span":1,"col_span":1,"label":"","xmin":128,"ymin":178,"xmax":202,"ymax":219,"score":0.5214844,"text":"21","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"a910e3fb-0ed3-4e86-a553-5511260ecd61","row":5,"col":4,"row_span":1,"col_span":1,"label":"","xmin":200,"ymin":179,"xmax":274,"ymax":221,"score":0.4399414,"text":"31","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"07c8f2e3-2fe6-4a2d-ba72-60338a775077","row":5,"col":5,"row_span":1,"col_span":1,"label":"","xmin":273,"ymin":181,"xmax":386,"ymax":224,"score":0.38208008,"text":"58 о QP","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""},{"id":"98086bfc-aff9-42b3-bce3-d15b0959828c","row":5,"col":6,"row_span":1,"col_span":1,"label":"","xmin":384,"ymin":184,"xmax":485,"ymax":226,"score":0.62890625,"text":"15 OP","row_label":"","verification_status":"correctly_predicted","status":"","failed_validation":"","label_id":""}],"status":"correctly_predicted","page_no":0,"label_id":""}],"page":0,"request_file_id":"bc740aae-8411-4371-ba33-21cbe95a196e","filepath":"uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg","id":"87db35ef-0508-11ee-8a19-ce5295a60849","rotation":0,"file_url":"uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/RawPredictions/bc740aae-8411-4371-ba33-21cbe95a196e","request_metadata":"","processing_type":"sync"}],"signed_urls":{"uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg":{"original":"https://nnts.imgix.net/uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg?expires=1686138872&or=0&s=2d820fdb664e13611a2c445e3f5bb0d4","original_compressed":"https://nnts.imgix.net/uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg?auto=compress&expires=1686138872&or=0&s=1cbb2904154eb7909aa61dd24ec0947f","thumbnail":"https://nnts.imgix.net/uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg?auto=compress&expires=1686138872&w=240&s=2620051194cf805381ae78a64bc89444","acw_rotate_90":"https://nnts.imgix.net/uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg?auto=compress&expires=1686138872&or=270&s=9a32f9b39bf05d7f5427da0e4bc99ed1","acw_rotate_180":"https://nnts.imgix.net/uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg?auto=compress&expires=1686138872&or=180&s=6911fb4fa4f627910a73da616a55c494","acw_rotate_270":"https://nnts.imgix.net/uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg?auto=compress&expires=1686138872&or=90&s=839cd60ff51fbfc96003953add2e1922","original_with_long_expiry":"https://nnts.imgix.net/uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/PredictionImages/eb137517-de26-4a39-b650-c4cdd9addfda.jpeg?expires=1701676472&or=0&s=29779e8ed705672417f38e008c4cdaa9"},"uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/RawPredictions/bc740aae-8411-4371-ba33-21cbe95a196e":{"original":"https://nanonets.s3.us-west-2.amazonaws.com/uploadedfiles/c980be77-d1ca-4bee-b6a2-f8ba37221550/RawPredictions/bc740aae-8411-4371-ba33-21cbe95a196e?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5F4WPNNTLX3QHN4W%2F20230607%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230607T075432Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&response-cache-control=no-cache&X-Amz-Signature=a6e2cd00d02e70d9ff8bebce7958f1af6e9fea10d5bec1b8b1100b7f2592abc3","original_compressed":"","thumbnail":"","acw_rotate_90":"","acw_rotate_180":"","acw_rotate_270":"","original_with_long_expiry":""}}},"tickets":{"1":{"1":10,"2":18,"3":22,"4":37,"5":65,"6":8},"2":{"1":2,"2":45,"3":49,"4":58,"5":63,"6":5},"3":{"1":13,"2":18,"3":39,"4":40,"5":50,"6":7},"4":{"1":14,"2":16,"3":28,"4":40,"5":60,"6":8},"5":{"1":6,"2":7,"3":21,"4":31,"5":58,"6":15}},"agentTickets":[{"numbers":[10,18,22,37],"powerNumbers":[]},{"numbers":[2,45,49,58],"powerNumbers":[]},{"numbers":[13,18,39,40],"powerNumbers":[]},{"numbers":[14,16,28,40],"powerNumbers":[]},{"numbers":[6,7,21,31],"powerNumbers":[]}]}
    response?.data?.result?.forEach(({ prediction }: any) => {
      prediction.forEach(({ cells }: any) => {
        cells.forEach(({ col, row, text }: any) => {
          const resultNumber = Number(text.substring(0, 2));
          if (resultNumber) {
            if (tickets[row]) {
              tickets[row][col] = resultNumber;
            } else {
              tickets[row] = {};
              tickets[row][col] = resultNumber;
            }
          }
        })
      })
    });
    const agentTickets: AgentTicket[] = [];
    for (const ticket in tickets) {
      const keys = Object.keys(tickets[ticket]).sort((a: any, b: any) => a - b) as string[];
      const numberKeys = keys.splice(0, lottery.numbersPerLine.maxSelectTotalNumber);
      const powerNumberKeys = keys
      agentTickets.push({
        numbers: numberKeys.map((i) => tickets[ticket][i]),
        powerNumbers: powerNumberKeys.map((i) => tickets[ticket][i])
      })
    }
    return {
      response: response?.data,
      tickets,
      agentTickets
    };
  }

  validateDto(createCustomerTicketDto: Partial<CustomerTicket>): boolean {
    const customerTicketsMap = createCustomerTicketDto.tickets?.reduce((customerTicketsMap, ticket) => {
      customerTicketsMap.set(`numbers_${ticket.numbers.map((n) => Number(n)).sort().join(',')}_powerNumbers_${ticket.powerNumbers.map((n) => Number(n)).sort().join(',')}`, true);
      return customerTicketsMap;
    }, new Map());
    if ((createCustomerTicketDto.tickets?.length) !== customerTicketsMap?.size) {
      throw ErrorMessageException("Tickets line should be unique");
    }
    return true;
  }

  validateAgentTicket(agentTickets: Ticket[], customerTickets: Ticket[], enableCustomerPickNumber: boolean = false): boolean {
    if (agentTickets.length !== customerTickets.length) {
      throw ErrorMessageException("Tickets lines are not matched with customer tickets line");
    }
    if (!enableCustomerPickNumber) {
      return true;
    }
    const customerTicketsMap = customerTickets.reduce((customerTicketsMap, ticket) => {
      customerTicketsMap.set(`numbers_${ticket.numbers.map((n) => Number(n)).sort().join(',')}_powerNumbers_${ticket.powerNumbers.map((n) => Number(n)).sort().join(',')}`, true);
      return customerTicketsMap;
    }, new Map());
    const isValid = agentTickets.every((agentTicket) => {
      return customerTicketsMap.get(`numbers_${agentTicket.numbers.map((n) => Number(n)).sort().join(',')}_powerNumbers_${agentTicket.powerNumbers.map((n) => Number(n)).sort().join(',')}`)
    });
    if (!isValid) {
      throw ErrorMessageException("Tickets are not matched with customer tickets");
    }
    return true;
  }

  async update(
    _id: ObjectId,
    createCustomerTicketDto: Partial<CustomerTicket>
  ): Promise<CustomerTicket | null> {
    this.validateDto(createCustomerTicketDto);
    const customerTicket = await this.customerTicketModel.findByIdAndUpdate(_id, {
      ...createCustomerTicketDto
    },
      {
        new: true
      }
    );
    return customerTicket;
  }

  async assignTicketToAgent(
    user: User,
    agentTicketDto: {
      customerTicketId: ObjectId,
      agentId: ObjectId
    }
  ): Promise<CustomerTicket | null> {
    if (!(user.type === UserType.ADMIN || user.type === UserType.SUPER_ADMIN)) {
      throw ErrorMessageException("User unable to assign ticket to agent");
    }
    const agentUser = await this.userService.findById(agentTicketDto.agentId);
    if (!agentUser) {
      throw ErrorMessageException("Agent not found");
    }
    const assignedAgentTickets = await this.customerTicketModel
      .count({
        agentId: agentUser._id,
        isActive: true,
        status: {
          $in: ["assigned", "purchasing-physical-ticket"]
        }
      })
    if (agentUser.maxAssignedTicket <= assignedAgentTickets) {
      throw ErrorMessageException("Already assigned maximum tickets");
    }
    const agentTicket = await this.customerTicketModel.findByIdAndUpdate({
      _id: agentTicketDto.customerTicketId
    },
      {
        agentId: agentTicketDto.agentId,
        status: 'assigned'
      },
      {
        new: true
      }
    );
    return agentTicket
  }

  async delete(id: string, customerId: string): Promise<CustomerTicket> {
    const customerTicket = await this.customerTicketModel.findOneAndUpdate({
      _id: id, customerId
    }, {
      isActive: false,
      customerId,
    }, {
      new: true
    });
    if (!customerTicket) {
      throw ErrorMessageException("User unable to delete lottery");
    }
    return customerTicket;
  }

  async updateAgentTicket(_id: ObjectId, agent: User, agentTicket: Partial<CustomerTicket>, medias: Express.Multer.File[]) {
    const ticket = await this.customerTicketModel.findById(_id);
    const isValid = this.validateAgentTicket(agentTicket?.agentTickets || [], ticket?.tickets || [], ticket?.enableCustomerPickNumber);
    if (!isValid) {
      throw ErrorMessageException("Tickets should be match with customer ticket");
    }
    const images: string[] = [];
    for (const media of medias) {
      if (media && process.env.AWS_ACCESS_KEY_ID) {
        const url = await this.fileUploadService.upload(media);
        images.push(url);
      } else if (media) {
        const url = `${config.apiUrl}/uploads/${media.filename}`;
        images.push(url);
      }
    }
    const updatedObj: any = {
      'agentTickets': agentTicket?.agentTickets,
      agentScanTicket: images
    }
    const customerTicket = await this.customerTicketModel.findByIdAndUpdate(_id, {
      $addToSet: updatedObj,
      status: 'purchased-original-ticket',
      isVerified: true,
      ...(!ticket?.enableCustomerPickNumber ? {
        tickets: agentTicket?.agentTickets || []
      } : {})
    },
      {
        new: true
      }
    );
    if (!customerTicket) {
      throw ErrorMessageException("Unable to update");
    }
    const customer = await this.customerService.findById(customerTicket?.customerId);
    const ticketDetails: string[] = [];
    customerTicket.tickets.map((line) => {
      ticketDetails.push(
        `
        <div>
          <div style="display:flex; align-items:center;  justify-content: center;">
            <div style="font-size: large; font-weight: 300;">
            Numbers : 
            </div>  
            <div style="display:flex; align-items:center;  justify-content: center;">  
              ${line.numbers.map((n) => `
              <div style="display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          border-radius: 100%;
                          background: #322ea0; align-items: center;
                          margin-left: 4px;
                          justify-content: center; padding:5px;">
                        ${n}
                </div>
              `).join('')}
              ${line.powerNumbers.map((n) => `
              <div style="display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          border-radius: 100%;
                          background: #322ea0; align-items: center;
                          margin-left: 4px;
                          justify-content: center; padding:5px;">
                        ${n}
                </div>
              `).join('')}
            </div>
          </div>
          <div style="display:flex; align-items:center">
              <div style="font-size: large; font-weight: 300;">
              Matched Numbers : 
              </div>  
              <div style="display:flex; align-items:center;  justify-content: center;">  
                ${line.matchedNumbers.map((n) => `
                <div style="display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-left: 4px;
                            color: white;
                            border-radius: 100%;
                            background: red; align-items: center;
                            padding:5px;">
                          ${n}
                  </div>
                `).join('')}
                ${line.matchedPowerNumbers.map((n) => `
                <div style="display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            border-radius: 100%;
                            background: #322ea0; align-items: center;
                            margin-left: 4px;
                            justify-content: center; padding:5px;">
                          ${n}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        `
      )
    });

    try {
      const emailData = await this.pageContentService.findBySlug('customer-ticket-purchase-email');
      let emailSubject = emailData.subject[customer.language || 'en'] ?
        emailData.subject[customer.language || 'en'] : (emailData.subject.en || '');
      let emailTemplate = emailData.content[customer.language || 'en'] ?
        emailData.content[customer.language || 'en'] : (emailData.content.en || '');
      emailSubject = emailSubject.replace('{{CUSTOMER_NAME}}', `${customer.name}`);
      emailTemplate = emailTemplate.replace('{{CUSTOMER_NAME}}', `${customer.name}`);
      emailTemplate = emailTemplate.replace('{{TICKET_DETAILS}}', `${ticketDetails.join('')}`);
      await this.customerMailerService.sendMailToCustomer(customer.email, emailSubject, emailTemplate, customerTicket.agentScanTicket);
    } catch (error) {
      console.log(`Error while sending winning email to customer`)
    }
    return customerTicket;
  }

  async setToPurchase(_id: ObjectId) {
    const customerTicket = await this.customerTicketModel.findByIdAndUpdate(_id, {
      status: 'purchasing-physical-ticket'
    },
      {
        new: true
      }
    );
    return customerTicket;
  }

  async findWinners(lottery: Lottery) {
    const customerTickets = await this.customerTicketModel.aggregate([{
      $match: {
        lotteryId: lottery._id,
        status: {
          $nin: ["draft"]
        }
      }
    }]);
    const winningNumbers = {
      numbers: lottery.winningNumbers.numbers.reduce((numbers: Record<string, boolean>, n: number) => {
        numbers[n] = true;
        return numbers
      }, {}),
      powerNumbers: lottery.winningNumbers.powerNumbers.reduce((powerNumbers: Record<string, boolean>, n: number) => {
        powerNumbers[n] = true;
        return powerNumbers
      }, {})
    }
    const prizeBreakDown = lottery.prizeBreakDown.reduce((prizeBreakDown: any, prize) => {
      prizeBreakDown[`${prize.number}_${prize.powerNumber}`] = prize;
      return prizeBreakDown;
    }, {});
    const winningCustomers: Record<string, Record<string, {
      numbers: number[];
      powerNumbers: number[];
      matchedNumbers: number[];
      matchedPowerNumbers: number[];
      priceBreakdown: { number: number, powerNumber: number, price: number },
      lineIndex: number;
    }[]>> = {};
    customerTickets.forEach((ct: CustomerTicket) => {
      ct.tickets.forEach(({
        numbers, powerNumbers
      }: {
        numbers: number[], powerNumbers: number[]
      }, lineIndex) => {
        const numberMatched = numbers.filter((n) => {
          return !!winningNumbers.numbers[n]
        });
        const powerNumberMatched = powerNumbers.filter((n) => {
          return !!winningNumbers.powerNumbers[n]
        });
        if (prizeBreakDown[`${numberMatched.length}_${powerNumberMatched.length}`]?.price) {
          if (!winningCustomers[ct.customerId as unknown as string]) {
            winningCustomers[ct.customerId as unknown as string] = {};
          }
          if (!winningCustomers[ct.customerId as unknown as string][ct._id]) {
            winningCustomers[ct.customerId as unknown as string][ct._id] = [];
          }
          winningCustomers[ct.customerId as unknown as string][ct._id].push({
            numbers,
            powerNumbers,
            matchedNumbers: numberMatched,
            matchedPowerNumbers: powerNumberMatched,
            priceBreakdown: prizeBreakDown[`${numberMatched.length}_${powerNumberMatched.length}`],
            lineIndex
          })
        };
      })
    });
    for (const customerId in winningCustomers) {
      const customer = await this.customerService.findById(customerId as unknown as ObjectId);
      for (const customerTicketId in winningCustomers[customerId]) {
        const customerTicket = await this.customerTicketModel.findById(customerTicketId);
        if (customerTicket) {
          const tickets = customerTicket.tickets;
          const ticketDetails = [];
          for (let line of winningCustomers[customerId][customerTicketId]) {
            const {
              matchedNumbers,
              matchedPowerNumbers,
              priceBreakdown,
              lineIndex } = line
            tickets[lineIndex].isWinner = true;
            tickets[lineIndex].lineIndex = lineIndex;
            tickets[lineIndex].matchedNumbers = matchedNumbers;
            tickets[lineIndex].matchedPowerNumbers = matchedPowerNumbers;
            tickets[lineIndex].priceBreakdown = priceBreakdown;
            const customerWalletTransaction = await this.customerWalletTransactionService.createWallerTransaction({
              lotteryId: lottery._id,
              customerId: customerId as unknown as ObjectId,
              transactionType: TransactionType.WON,
              amount: priceBreakdown.price,
              customerTicketId: customerTicketId as unknown as ObjectId,
              isActive: true,
              customerCurrency: 'USD',
              isGivenByCash: priceBreakdown.price > 600,
              cashStatus: priceBreakdown.price > 600 ? 'pending' : undefined,
              ticketInformation: tickets[lineIndex],

            });
            tickets[lineIndex].walletTransactionId = customerWalletTransaction._id;
            ticketDetails.push(
              `
              <div>
                <div style="display:flex; align-items:center;  justify-content: center;">
                  <div style="font-size: large; font-weight: 300;">
                  Numbers : 
                  </div>  
                  <div style="display:flex; align-items:center;  justify-content: center;">  
                    ${line.numbers.map((n) => `
                    <div style="display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                border-radius: 100%;
                                background: #322ea0; align-items: center;
                                margin-left: 4px;
                                justify-content: center; padding:5px;">
                              ${n}
                      </div>
                    `).join('')}
                    ${line.powerNumbers.map((n) => `
                    <div style="display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                border-radius: 100%;
                                background: #322ea0; align-items: center;
                                margin-left: 4px;
                                justify-content: center; padding:5px;">
                              ${n}
                      </div>
                    `).join('')}
                  </div>
                </div>
                <div style="display:flex; align-items:center">
                    <div style="font-size: large; font-weight: 300;">
                    Matched Numbers : 
                    </div>  
                    <div style="display:flex; align-items:center;  justify-content: center;">  
                      ${line.matchedNumbers.map((n) => `
                      <div style="display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  margin-left: 4px;
                                  color: white;
                                  border-radius: 100%;
                                  background: red; align-items: center;
                                  padding:5px;">
                                ${n}
                        </div>
                      `).join('')}
                      ${line.matchedPowerNumbers.map((n) => `
                      <div style="display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  color: white;
                                  border-radius: 100%;
                                  background: #322ea0; align-items: center;
                                  margin-left: 4px;
                                  justify-content: center; padding:5px;">
                                ${n}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
                <div style="display:flex; align-items:center">
                  <div style="font-size: large; font-weight: 300;">
                  Prize Money : 
                  </div>
                  <div style="font-size: large; font-weight: 300;">
                    ${priceBreakdown.price} $
                  </div>  
                </div>
              </div>
              `
            )
          }
          await this.customerTicketModel.findByIdAndUpdate(customerTicketId, {
            tickets
          });
          const emailData = await this.pageContentService.findBySlug('winning-email');
          let emailSubject = emailData.subject[customer.language || 'en'] ?
            emailData.subject[customer.language || 'en'] : (emailData.subject.en || '');
          let emailTemplate = emailData.content[customer.language || 'en'] ?
            emailData.content[customer.language || 'en'] : (emailData.content.en || '');
          emailSubject = emailSubject.replace('{{CUSTOMER_NAME}}', `${customer.name}`);
          emailTemplate = emailTemplate.replace('{{CUSTOMER_NAME}}', `${customer.name}`);
          emailTemplate = emailTemplate.replace('{{TICKET_DETAILS}}', `${ticketDetails.join('')}`);
          try {
            await this.customerMailerService.sendMailToCustomer(customer.email, emailSubject, emailTemplate);
          } catch (error) {
            console.log(`Error while sending winning email to customer`)
          }
          try {
            await this.customerPhoneService.sendSmsToCustomer(customer.phoneNo, `Hi ${customer.name} you have win lottery please visit app`);
          } catch (error) {
            console.log(`Error while sending winning sms to customer`)
          }
        }
      }
    }
  }
}