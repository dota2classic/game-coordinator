import { EventBus, EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueService } from "mm/queue/service/queue.service";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueModel } from "mm/queue/model/queue.model";
import { Logger } from "@nestjs/common";
import { RoomBalance } from "../../room/model/entity/room-balance";


@EventsHandler(GameCheckCycleEvent)
export class GameCheckCycleHandler
  implements IEventHandler<GameCheckCycleEvent>
{
  private logger = new Logger(GameCheckCycleHandler.name);

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

    await this.updateWaitingScore(q);




    if (event.mode === MatchmakingMode.BOTS) {
      this.handleQueue(q, this.qService.findBotsGame.bind(this.qService))
    } else if (event.mode === MatchmakingMode.SOLOMID) {
      this.handleQueue(q, this.qService.findSolomidGame.bind(this.qService))
    } else {
      this.handleQueue(q, this.qService.findBalancedGame.bind(this.qService))
    }
  }

  private handleQueue(
    q: QueueModel,
    obtainBalance: (q: QueueModel) => RoomBalance | undefined,
  ) {
    let balance = obtainBalance(q);
    while (balance !== undefined) {
      this.makeGame(balance, q);
      balance = obtainBalance(q);
    }
  }

  private updateWaitingScore(q: QueueModel) {
    q.entries.forEach((entry) => entry.waitingScore++);
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
