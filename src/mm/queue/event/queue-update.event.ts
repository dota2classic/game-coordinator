import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { QueueEntryId } from "src/mm/queue/model/queue-entry.model";

export class QueueUpdateEvent {
  constructor(
    public readonly mode: MatchmakingMode,
    public readonly queueEntryId: QueueEntryId,
    public readonly queueSize: number
  ) {}
}
