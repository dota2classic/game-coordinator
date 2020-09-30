import { AggregateRoot } from '@nestjs/cqrs';
import { MatchmakingMode } from 'src/mm/queue/model/matchmaking-mode';
import { QueueCreatedEvent } from 'src/mm/queue/event/queue-created.event';

export class QueueModel extends AggregateRoot {
  constructor(public readonly mode: MatchmakingMode) {
    super();
  }

  public init() {
    this.apply(new QueueCreatedEvent(this.mode));
  }
}
