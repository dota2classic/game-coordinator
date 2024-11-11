import { AggregateRoot } from "@nestjs/cqrs";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueCreatedEvent } from "gateway/gateway/events/queue-created.event";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { QueueUpdatedEvent } from "gateway/gateway/events/queue-updated.event";
import { PartyId } from "gateway/gateway/shared-types/party-id";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";

export class QueueModel extends AggregateRoot {
  public readonly entries: QueueEntryModel[] = [];

  public static id(mode: MatchmakingMode, version: Dota2Version) {
    return `${mode}_${version}`
  }

  public get compId() {
    return QueueModel.id(this.mode, this.version);
  }

  constructor(
    public readonly mode: MatchmakingMode,
    public readonly version: Dota2Version,
  ) {
    super();
  }

  public get size() {
    return this.entries.reduce((a, b) => a + b.size, 0);
  }

  public init() {
    this.apply(new QueueCreatedEvent(this.mode, this.version));
  }

  public addEntry(entry: QueueEntryModel) {
    if (!this.entries.find(it => it.id === entry.id)) {
      this.entries.push(entry);
      this.apply(new QueueUpdatedEvent(this.mode, this.version));
    }
  }

  public removeAll(entries: QueueEntryModel[]) {
    entries.forEach(it => {
      const index = this.entries.findIndex(t => t.id === it.id);
      if (index !== -1) this.entries.splice(index, 1);
    });
    this.apply(new QueueUpdatedEvent(this.mode, this.version));
  }

  public removeEntry(partyId: PartyId) {
    const index = this.entries.findIndex(t => t.partyID === partyId);
    if (index !== -1) {
      this.entries.splice(index, 1);
      this.publish(new QueueUpdatedEvent(this.mode, this.version));
    }
  }
}
