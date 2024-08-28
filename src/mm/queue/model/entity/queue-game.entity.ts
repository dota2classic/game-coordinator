import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";

export class QueueGameEntity {
  constructor(
    public readonly mode: MatchmakingMode,
    public readonly entries: QueueEntryModel[],
  ) {}
}
