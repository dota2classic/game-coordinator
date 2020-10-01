import { AggregateRoot } from "@nestjs/cqrs";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { QueueCreatedEvent } from "src/mm/queue/event/queue-created.event";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";
import { QueueUpdateEvent } from "src/mm/queue/event/queue-update.event";
import { PartyId } from "src/mm/party/model/party.model";

export class QueueModel extends AggregateRoot {
  public readonly entries: QueueEntryModel[] = [];

  constructor(public readonly mode: MatchmakingMode) {
    super();
  }

  public get size() {
    return this.entries.reduce((a, b) => a + b.size, 0);
  }

  public init() {
    this.apply(new QueueCreatedEvent(this.mode));
  }

  public addEntry(entry: QueueEntryModel) {
    if (!this.entries.find(it => it.id === entry.id)) {
      this.entries.push(entry);
      this.apply(new QueueUpdateEvent(this.mode));
    }
  }

  public removeAll(entries: QueueEntryModel[]) {
    entries.forEach(it => {
      const index = this.entries.findIndex(t => t.id === it.id);
      if (index !== -1) this.entries.splice(index, 1);
    });
    this.apply(new QueueUpdateEvent(this.mode));
  }

  public removeEntry(partyId: PartyId) {
    const index = this.entries.findIndex(t => t.partyID === partyId);
    if (index !== -1) {
      this.entries.splice(index, 1);
      this.publish(new QueueUpdateEvent(this.mode));
    }
  }
}
