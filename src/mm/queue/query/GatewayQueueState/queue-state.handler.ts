import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { GatewayQueueStateQuery } from "src/gateway/gateway/queries/GatewayQueueState/gateway-queue-state.query";
import {
  GatewayQueueStateQuery_Player,
  GatewayQueueStateQuery_QueueEntry,
  GatewayQueueStateQueryResult,
} from "src/gateway/gateway/queries/GatewayQueueState/gateway-queue-state-query.result";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { PartyRepository } from "src/mm/party/repository/party.repository";

@QueryHandler(GatewayQueueStateQuery)
export class GatewayQueueStateHandler
  implements
    IQueryHandler<GatewayQueueStateQuery, GatewayQueueStateQueryResult> {
  private readonly logger = new Logger(GatewayQueueStateHandler.name);

  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly partyRepository: PartyRepository,
  ) {}

  async execute(
    command: GatewayQueueStateQuery,
  ): Promise<GatewayQueueStateQueryResult> {
    const q = await this.queueRepository.get(command.mode);
    const entries = q.entries.map(
      t =>
        new GatewayQueueStateQuery_QueueEntry(
          t.partyID,
          t.players.map(z => new GatewayQueueStateQuery_Player(z.playerId)),
        ),
    );
    return new GatewayQueueStateQueryResult(command.mode, entries);
  }
}
