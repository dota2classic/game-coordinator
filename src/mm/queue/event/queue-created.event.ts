import { MatchmakingMode } from 'src/mm/queue/model/matchmaking-mode';

export class QueueCreatedEvent {
  public constructor(public readonly mode: MatchmakingMode) {}
}
