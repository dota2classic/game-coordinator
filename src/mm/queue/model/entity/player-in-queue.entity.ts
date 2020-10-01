import { PlayerId } from "src/gateway/shared-types/player-id";

export class PlayerInQueueEntity {
  constructor(
    public readonly playerId: PlayerId,
    public readonly mmr: number,
  ) {}
}
