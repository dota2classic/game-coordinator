import { PlayerId } from "gateway/gateway/shared-types/player-id";
import { BanStatus } from "gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";

export class PlayerInQueueEntity {
  constructor(
    public readonly playerId: PlayerId,
    public readonly mmr: number,
    public readonly recentWinrate: number,
    public readonly recentKDA: number,
    public readonly gamesPlayed: number,
    public readonly banStatus: BanStatus | undefined,
  ) {}
}
