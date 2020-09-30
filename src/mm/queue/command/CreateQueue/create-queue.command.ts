import { MatchmakingMode } from 'src/mm/queue/model/matchmaking-mode';

export class CreateQueueCommand {
  constructor(public readonly mode: MatchmakingMode) {}
}
