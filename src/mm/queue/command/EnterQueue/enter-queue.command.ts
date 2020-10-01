import { MatchmakingMode } from "src/gateway/shared-types/matchmaking-mode";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import { PartyId } from "src/gateway/shared-types/party-id";

export class EnterQueueCommand {
  constructor(
    public readonly partyId: PartyId,
    public readonly players: PlayerInQueueEntity[],
    public readonly mode: MatchmakingMode,
  ) {}

  public get size(){
    return this.players.length;
  }
}
