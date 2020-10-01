import { MatchmakingMode } from 'src/gateway/gateway/shared-types/matchmaking-mode';

export class CreateQueueCommand {
  constructor(public readonly mode: MatchmakingMode) {}
}
