import { AggregateRoot } from "@nestjs/cqrs";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueCreatedEvent } from "gateway/gateway/events/queue-created.event";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { QueueUpdatedEvent } from "gateway/gateway/events/queue-updated.event";
import { PartyId } from "gateway/gateway/shared-types/party-id";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";
import { PartyQueueStateUpdatedEvent } from "../../../gateway/gateway/events/mm/party-queue-state-updated.event";
import { Logger } from "@nestjs/common";

export class QueueModel extends AggregateRoot {
  private logger = new Logger(QueueModel.name);

  public readonly entries: QueueEntryModel[] = [];

  public static id(mode: MatchmakingMode, version: Dota2Version) {
    return `${mode}_${version}`;
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
    if (!this.entries.find((it) => it.id === entry.id)) {
      this.entries.push(entry);
      this.updateParty(entry, true);
      this.apply(new QueueUpdatedEvent(this.mode, this.version));
    }
  }

  public removeAll(entries: QueueEntryModel[]) {
    entries.forEach((it) => {
      const index = this.entries.findIndex((t) => t.id === it.id);
      if (index !== -1) {
        const [removed] = this.entries.splice(index, 1);
        this.updateParty(removed, false);
      }
    });
    this.apply(new QueueUpdatedEvent(this.mode, this.version));
  }

  public removeEntry(partyId: PartyId) {
    const index = this.entries.findIndex((t) => t.partyID === partyId);
    if (index !== -1) {
      const [removed] = this.entries.splice(index, 1);
      this.updateParty(removed, false);
      this.publish(new QueueUpdatedEvent(this.mode, this.version));
    }
  }

  private updateParty(entry: QueueEntryModel, inQueue: boolean) {
    this.publish(
      new PartyQueueStateUpdatedEvent(
        entry.partyID,
        entry.players.map((it) => it.playerId),
        inQueue ? { mode: this.mode, version: this.version } : undefined,
      ),
    );
  }
}
