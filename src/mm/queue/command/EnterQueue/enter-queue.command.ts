import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { PartyId } from "gateway/gateway/shared-types/party-id";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";

export class EnterQueueCommand {
  constructor(
    public readonly partyId: PartyId,
    public readonly players: PlayerInQueueEntity[],
    public readonly mode: MatchmakingMode,
    public readonly version: Dota2Version,
  ) {}

  public get size() {
    return this.players.length;
  }
}
