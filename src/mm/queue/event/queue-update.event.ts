import { MatchmakingMode } from "src/gateway/shared-types/matchmaking-mode";
import { QueueEntryId } from "src/mm/queue/model/queue-entry.model";

export class QueueUpdateEvent {
  constructor(
    public readonly mode: MatchmakingMode
  ) {}
}
