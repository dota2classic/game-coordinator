import { QueueEntryModel } from "mm/queue/model/queue-entry.model";

export class BadRoomFinalizedEvent {
  constructor(public readonly goodParties: QueueEntryModel[]) {}
}
