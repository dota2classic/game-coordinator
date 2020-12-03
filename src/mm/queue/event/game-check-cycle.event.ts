import {MatchmakingMode} from "src/gateway/gateway/shared-types/matchmaking-mode";

export class GameCheckCycleEvent {
  constructor(public readonly mode: MatchmakingMode) {
  }
}