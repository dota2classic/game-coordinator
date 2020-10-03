import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { QueryBus } from "@nestjs/cqrs";
import { construct } from "src/gateway/gateway/util/construct";
import { QueueStateQuery } from "./gateway/queries/QueueState/queue-state.query";
import { QueueStateQueryResult } from "src/gateway/gateway/queries/QueueState/queue-state-query.result";

@Controller()
export class QueryController {
  constructor(private readonly qbus: QueryBus) {}

  @MessagePattern("QueueStateQuery")
  async QueueStateQuery(
    query: QueueStateQuery,
  ): Promise<QueueStateQueryResult> {
    return this.qbus.execute(construct(QueueStateQuery, query));
  }
}
