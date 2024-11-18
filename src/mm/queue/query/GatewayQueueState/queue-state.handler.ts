import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { GetQueueStateQuery } from "gateway/gateway/queries/QueueState/get-queue-state.query";
import { GetQueueStateQueryResult } from "gateway/gateway/queries/QueueState/get-queue-state-query.result";

@QueryHandler(GetQueueStateQuery)
export class QueueStateHandler
  implements IQueryHandler<GetQueueStateQuery, GetQueueStateQueryResult> {
  private readonly logger = new Logger(QueueStateHandler.name);

  constructor(private readonly queueRepository: QueueRepository) {}

  async execute(
    command: GetQueueStateQuery,
  ): Promise<GetQueueStateQueryResult> {
    const q = await this.queueRepository.get(
      QueueRepository.id(command.mode, command.version),
    );

    if (!q) return new GetQueueStateQueryResult(command.mode, []);
    return new GetQueueStateQueryResult(
      command.mode,
      q.entries.map((t) => ({
        partyID: t.partyID,
        players: t.players.map((t) => t.playerId),
      })),
    );
  }
}
