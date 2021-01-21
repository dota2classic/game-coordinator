import { AggregateRoot } from "@nestjs/cqrs";
import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import { PartyId } from "src/gateway/gateway/shared-types/party-id";

export type QueueEntryId = string;

export class QueueEntryModel {
  public get id(): QueueEntryId {
    return `${this.mode}${this.partyID}`;
  }

  constructor(
    public readonly partyID: PartyId,
    public readonly mode: MatchmakingMode,
    public readonly players: PlayerInQueueEntity[],
    public readonly score: number
  ) {
  }

  public get size() {
    return this.players.length;
  }

  public get totalMMR() {
    return this.players.reduce((a, b) => a + b.mmr, 0);
  }

  public get averageMMR() {
    return this.totalMMR / this.size;
  }
}
