import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { GatewayQueueStateQuery } from "src/gateway/gateway/queries/GatewayQueueState/gateway-queue-state.query";
import { GatewayQueueStateResult } from "src/gateway/gateway/queries/GatewayQueueState/gateway-queue-state.result";

@QueryHandler(GatewayQueueStateQuery)
export class GatewayQueueStateHandler
  implements IQueryHandler<GatewayQueueStateQuery, GatewayQueueStateResult> {
  private readonly logger = new Logger(GatewayQueueStateHandler.name);

  constructor() {}

  async execute(command: GatewayQueueStateQuery) {
    return new GatewayQueueStateResult(command.mode);
  }
}
