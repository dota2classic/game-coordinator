import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { PartyId } from "gateway/gateway/shared-types/party-id";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";

export type QueueEntryId = string;

export class QueueEntryModel {
  public get id(): QueueEntryId {
    return `${this.mode}${this.partyID}`;
  }

  constructor(
    public readonly partyID: PartyId,
    public readonly mode: MatchmakingMode,
    public readonly players: PlayerInQueueEntity[],
    public readonly score: number,
    public readonly version: Dota2Version,
    public DeviationScore: number = 0
  ) {
  }

  public get averageScore(){
    return this.score / this.size;
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
