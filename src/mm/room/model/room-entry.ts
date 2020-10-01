import { PlayerId } from "src/mm/player/model/player.model";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";

export class RoomEntry {
  constructor(
    public readonly partyId: PlayerId,
    public readonly mode: MatchmakingMode
  ) {}
}
