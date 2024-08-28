import {MatchmakingMode} from 'gateway/gateway/shared-types/matchmaking-mode';
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";

export class CreateQueueCommand {
  constructor(public readonly mode: MatchmakingMode, public readonly version: Dota2Version) {}
}
