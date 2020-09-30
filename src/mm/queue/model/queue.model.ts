import { AggregateRoot } from "@nestjs/cqrs";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { QueueCreatedEvent } from "src/mm/queue/event/queue-created.event";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";
import { QueueUpdateEvent } from "src/mm/queue/event/queue-update.event";


export class QueueModel extends AggregateRoot {


  private readonly queue: QueueEntryModel[] = [];

  constructor(public readonly mode: MatchmakingMode) {
    super();
  }

  public init() {
    this.apply(new QueueCreatedEvent(this.mode));
  }

  addEntry(entry: QueueEntryModel) {
    if(!this.queue.find(it => it.id === entry.id)){
      this.queue.push(entry);
      this.apply(new QueueUpdateEvent(this.mode, entry.id))
    }
  }
}
