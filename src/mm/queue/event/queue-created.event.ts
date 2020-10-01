import { MatchmakingMode } from 'src/gateway/gateway/shared-types/matchmaking-mode';

export class QueueCreatedEvent {
  public constructor(public readonly mode: MatchmakingMode) {}
}
