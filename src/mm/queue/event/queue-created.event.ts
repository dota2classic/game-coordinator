import { MatchmakingMode } from 'src/gateway/shared-types/matchmaking-mode';

export class QueueCreatedEvent {
  public constructor(public readonly mode: MatchmakingMode) {}
}
