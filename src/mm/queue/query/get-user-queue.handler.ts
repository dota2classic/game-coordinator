import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { GetUserQueueQuery } from "src/gateway/gateway/queries/GetUserQueue/get-user-queue.query";
import { GetUserQueueQueryResult } from "src/gateway/gateway/queries/GetUserQueue/get-user-queue-query.result";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";

@QueryHandler(GetUserQueueQuery)
export class GetUserQueueHandler
  implements IQueryHandler<GetUserQueueQuery, GetUserQueueQueryResult> {
  private readonly logger = new Logger(GetUserQueueHandler.name);

  constructor(private readonly qRep: QueueRepository) {}

  async execute(command: GetUserQueueQuery): Promise<GetUserQueueQueryResult> {
    const q = await this.qRep.findQueueOf(command.player);

    return new GetUserQueueQueryResult(q?.mode);
  }
}
