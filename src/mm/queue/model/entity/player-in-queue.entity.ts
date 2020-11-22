import { PlayerId } from "src/gateway/gateway/shared-types/player-id";

export class PlayerInQueueEntity {
  constructor(
    public readonly playerId: PlayerId,
    public readonly mmr: number,
    public readonly recentWinrate: number,
    public readonly gamesPlayed: number,
  ) {}
}
