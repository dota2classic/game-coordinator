import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { GetQueueStateQuery } from "src/gateway/gateway/queries/QueueState/get-queue-state.query";
import { GetQueueStateQueryResult } from "src/gateway/gateway/queries/QueueState/get-queue-state-query.result";

@QueryHandler(GetQueueStateQuery)
export class QueueStateHandler
  implements IQueryHandler<GetQueueStateQuery, GetQueueStateQueryResult> {
  private readonly logger = new Logger(QueueStateHandler.name);

  constructor(private readonly queueRepository: QueueRepository) {}

  async execute(command: GetQueueStateQuery): Promise<GetQueueStateQueryResult> {
    const q = await this.queueRepository.get(command.mode);
    return new GetQueueStateQueryResult(
      command.mode,
      q.entries.map(t => ({
        partyID: t.partyID,
        players: t.players.map(t => t.playerId),
      })),
    );
  }
}
