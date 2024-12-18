import { EventBus, EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueService } from "mm/queue/service/queue.service";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueModel } from "mm/queue/model/queue.model";
import { Logger } from "@nestjs/common";
import { RoomBalance } from "../../room/model/entity/room-balance";

/**
 * TODO: Refactor this into a queue system so we don't need processMap
 */
@EventsHandler(GameCheckCycleEvent)
export class GameCheckCycleHandler
  implements IEventHandler<GameCheckCycleEvent>
{
  private logger = new Logger(GameCheckCycleHandler.name);
  private processMap: Partial<{
    [key in MatchmakingMode]: boolean;
  }> = {};

  constructor(
    private readonly rep: QueueRepository,
    private readonly qService: QueueService,
    private readonly ebus: EventBus,
  ) {}

  async handle(event: GameCheckCycleEvent) {
    // ok here we
    this.logger.verbose(`Checking for a game`, {
      mode: event.mode,
      version: event.version,
    });

    const q = await this.rep.get(QueueRepository.id(event.mode, event.version));
    if (!q) {
      this.logger.warn(`Game cycle for non-existing queue`, {
        mode: event.mode,
        version: event.version,
      });
      return;
    }

    if (event.mode === MatchmakingMode.BOTS) {
      const balance = this.qService.findBotsGame(q);
      this.makeGame(balance, q);
    }else if (event.mode === MatchmakingMode.SOLOMID) {
      const balance = this.qService.findSolomidGame(q)
      this.makeGame(balance, q);
    } else {
      const balance = this.qService.findBalancedGame(q);
      this.makeGame(balance, q);
    }
  }

  private makeGame(balance: RoomBalance | undefined, q: QueueModel) {
    if (!balance) {
      this.logger.warn("Can't find balanced game", {
        mode: q.mode,
        version: q.version,
      });
      return;
    }

    const [leftTeam, rightTeam] = balance.teams;
    this.logger.log(`Game found`, { mode: q.mode, version: q.version });
    q.removeAll([...leftTeam.parties, ...rightTeam.parties]);
    q.commit();

    this.logger.log(
      `Removed ${leftTeam.parties.length + rightTeam.parties.length} parties from queue`,
      {
        queue_length: q.size,
        removed: leftTeam.parties.length + rightTeam.parties.length,
        mode: q.mode,
        version: q.version,
      },
    );

    this.ebus.publish(new GameFoundEvent(balance, q.version, q.mode));
  }
}
