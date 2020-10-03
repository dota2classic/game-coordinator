import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueStateQuery } from "src/gateway/gateway/queries/QueueState/queue-state.query";
import { QueueStateQueryResult } from "src/gateway/gateway/queries/QueueState/queue-state-query.result";

@QueryHandler(QueueStateQuery)
export class QueueStateHandler
  implements IQueryHandler<QueueStateQuery, QueueStateQueryResult> {
  private readonly logger = new Logger(QueueStateHandler.name);

  constructor(private readonly queueRepository: QueueRepository) {}

  async execute(command: QueueStateQuery): Promise<QueueStateQueryResult> {
    const q = await this.queueRepository.get(command.mode);
    return new QueueStateQueryResult(
      command.mode,
      q.entries.map(t => ({
        partyID: t.partyID,
        players: t.players.map(t => t.playerId),
      })),
    );
  }
}
