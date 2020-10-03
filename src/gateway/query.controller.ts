import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { GatewayQueueStateQuery } from "src/gateway/gateway/queries/GatewayQueueState/gateway-queue-state.query";
import { QueryBus } from "@nestjs/cqrs";
import { construct } from "src/gateway/gateway/util/construct";
import { GatewayQueueStateQueryResult } from "src/gateway/gateway/queries/GatewayQueueState/gateway-queue-state-query.result";

@Controller()
export class QueryController {
  constructor(private readonly qbus: QueryBus) {}

  @MessagePattern("GatewayQueueStateQuery")
  async GatewayQueueStateQuery(
    query: GatewayQueueStateQuery,
  ): Promise<GatewayQueueStateQueryResult> {
    return this.qbus.execute(construct(GatewayQueueStateQuery, query));
  }
}
