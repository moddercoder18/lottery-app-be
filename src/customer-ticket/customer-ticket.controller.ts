import {
  Controller,
  Get,
  Post,
  Req,
  Put,
  UseGuards,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UploadedFiles
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { CustomerTicketService } from "./customer-ticket.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "../user/user.interface";
import { AdminCustomerTicketFilterDto, AgentCustomerTicketDto, AgentTicketDto, CreateCustomerTicketDto } from "./customer-ticket.interface";
import { excelFileFilter, imageFileFilter, multerStorage } from "../common/multer";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ObjectId } from 'mongoose'
import { Customer } from "../customer/customer.interface";
@ApiTags("customer-ticket")
@Controller("customer-ticket")
export class CustomerTicketController {
  constructor(private readonly customerTicketService: CustomerTicketService) { }

  @Get("")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  getALlCustomerTickets(@Req() req: Request) {
    const customer = req.user as Customer;
    return this.customerTicketService.getCustomerTickets(customer);
  }

  @Get("agent")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  getAllAssignedAgentTicket(@Req() req: Request) {
    const agent = req.user as User;
    return this.customerTicketService.getAssignedTicketsToAgent(agent);
  }

  
  @Get(":id")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  getCustomerTicketById(@Req() req: Request, @Param('id') id: string) {
    const customer = req.user as Customer;
    return this.customerTicketService.getCustomerTicketById(id, customer);
  }



  @Post("/admin")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  getAllTicketsForAdmin(@Body() adminCustomerTicketFilterDto: AdminCustomerTicketFilterDto) {
    return this.customerTicketService.getAllTicketsForAdmin(
      adminCustomerTicketFilterDto);
  }

  @Post("/scan-ticket/:id")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        }
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("file", 50, {
      storage: multerStorage,
    }),
  )
  @ApiConsumes("multipart/form-data")
  readTextFromImage(@Req() req: Request, @UploadedFiles() medias: Array<Express.Multer.File>, @Param('id') id: string) {
    const user = req.user as User;
    return this.customerTicketService.readTextFromImage(user, medias, id);
  }

  @Put("assigned-agent")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  async assignedCustomerTicketToAgent(
    @Req() req: Request,
    @Body() agentTicketDto: AgentTicketDto
  ) {
    const user = req.user as User;
    return this.customerTicketService.assignTicketToAgent(user, agentTicketDto as AgentTicketDto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard("customer-jwt"))
  @ApiBearerAuth("JWT-auth")
  deleteCustomerTicket(@Param('id') id: string, @Req() req: Request) {
    const customer = req.user as Customer;
    return this.customerTicketService.delete(id, customer._id);
  }

  @Put(":id/agent-ticket")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        agentTickets: {
          type: "array",
          properties: {
            items: {
              type: "object",
              properties: {
                numbers: {
                  type: "array",
                  properties: {
                    items: {
                      type: 'number'
                    }
                  }
                },
                powerNumbers: {
                  type: "array",
                  properties: {
                    items: {
                      type: 'number'
                    }
                  }
                },
              }
            }
          }
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("file", 50, {
      storage: multerStorage
    }),
  )
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth("JWT-auth")
  async updateCustomerTicketByAgent(
    @Req() req: Request,
    @Body() agentCustomerTicketDto: AgentCustomerTicketDto,
    @Param('id') id: ObjectId,
    @UploadedFiles() medias: Array<Express.Multer.File>
  ) {
    const agent = req.user as User;
    return this.customerTicketService.updateAgentTicket(id, agent, agentCustomerTicketDto as any, medias);
  }

  @Put(":id/set-to-purchase")
  @UseGuards(AuthGuard("admin-jwt"))
  @ApiBearerAuth("JWT-auth")
  async setToPurchase(
    @Req() req: Request,
    @Param('id') id: ObjectId,
  ) {
    const agent = req.user as User;
    return this.customerTicketService.setToPurchase(id);
  }

}
