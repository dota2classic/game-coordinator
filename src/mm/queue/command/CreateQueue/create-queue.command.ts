import { MatchmakingMode } from 'src/gateway/shared-types/matchmaking-mode';

export class CreateQueueCommand {
  constructor(public readonly mode: MatchmakingMode) {}
}
