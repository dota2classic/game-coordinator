import { AggregateRoot } from "@nestjs/cqrs";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { QueueCreatedEvent } from "src/mm/queue/event/queue-created.event";


type QueueEntry = unknown;

export class QueueModel extends AggregateRoot {


  private readonly queue: QueueEntry[] = [];

  constructor(public readonly mode: MatchmakingMode) {
    super();
  }

  public init() {
    this.apply(new QueueCreatedEvent(this.mode));
  }
}
