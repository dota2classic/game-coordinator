import { PartyId } from "src/mm/party/model/party.model";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";

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
