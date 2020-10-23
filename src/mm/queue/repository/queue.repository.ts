import {RuntimeRepository} from 'src/@shared/runtime-repository';
import {QueueModel} from 'src/mm/queue/model/queue.model';
import {Injectable} from '@nestjs/common';
import {EventPublisher} from '@nestjs/cqrs';
import {PlayerId} from "src/gateway/gateway/shared-types/player-id";

@Injectable()
export class QueueRepository extends RuntimeRepository<QueueModel, "mode"> {
  constructor(publisher: EventPublisher) {
    super(publisher);
  }

  async findQueueOf(player: PlayerId): Promise<QueueModel | undefined> {
    return [...this.cache.values()].find(t =>
      t.entries.find(z =>
        z.players.find(p => p.playerId.value === player.value),
      ),
    );
  }
}
