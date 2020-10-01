import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { QueueEntryId } from "src/mm/queue/model/queue-entry.model";

export class QueueUpdateEvent {
  constructor(
    public readonly mode: MatchmakingMode
  ) {}
}
