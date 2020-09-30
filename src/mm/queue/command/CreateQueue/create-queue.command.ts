import { MatchmakingMode } from 'src/mm/queue/model/entity/matchmaking-mode';

export class CreateQueueCommand {
  constructor(public readonly mode: MatchmakingMode) {}
}
