import { MatchmakingMode } from "src/gateway/shared-types/matchmaking-mode";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";

export class QueueGameEntity {
  constructor(
    public readonly mode: MatchmakingMode,
    public readonly entries: QueueEntryModel[],
  ) {}
}
