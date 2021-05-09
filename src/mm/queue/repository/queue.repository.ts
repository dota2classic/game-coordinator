import {RuntimeRepository} from 'src/@shared/runtime-repository';
import {QueueModel} from 'src/mm/queue/model/queue.model';
import {Injectable} from '@nestjs/common';
import {EventPublisher} from '@nestjs/cqrs';
import {PlayerId} from "src/gateway/gateway/shared-types/player-id";
import {MatchmakingMode} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";

@Injectable()
export class QueueRepository extends RuntimeRepository<QueueModel, "compId"> {
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

  static id(mode: MatchmakingMode, version: Dota2Version): string {
    return `${mode}_${version}`;
  }
}
