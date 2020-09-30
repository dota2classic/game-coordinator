import { MatchmakingMode } from 'src/mm/queue/model/entity/matchmaking-mode';

export class QueueCreatedEvent {
  public constructor(public readonly mode: MatchmakingMode) {}
}
