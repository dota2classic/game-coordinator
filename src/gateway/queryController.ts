import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { GatewayQueueStateQuery } from "src/gateway/gateway/queries/gateway-queue-state.query";

@Controller()
export class QueryController {
  @MessagePattern("GatewayQueueStateQuery")
  async GatewayQueueStateQuery(data: GatewayQueueStateQuery) {
    console.log(`Hey!`);
  }
}
