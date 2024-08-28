import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";

export class GameCheckCycleEvent {
  constructor(
    public readonly mode: MatchmakingMode,
    public readonly version: Dota2Version,
  ) {}
}
