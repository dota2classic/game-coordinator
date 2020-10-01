import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";

export class CheckForGameCommand {
  constructor(
    public readonly mode: MatchmakingMode,
    public readonly queueSize: number,
  ) {}
}
