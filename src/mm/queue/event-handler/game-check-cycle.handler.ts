import { EventBus, EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueService } from "mm/queue/service/queue.service";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { BalanceService } from "mm/queue/service/balance.service";
import { QueueModel } from "mm/queue/model/queue.model";
import { Logger } from "@nestjs/common";
import { RoomBalance } from "../../room/model/entity/room-balance";
import formatGameMode from "../../../gateway/gateway/util/formatGameMode";

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
    private readonly balanceService: BalanceService,
  ) {}

  async handle(event: GameCheckCycleEvent) {
    // ok here we

    const q = await this.rep.get(QueueRepository.id(event.mode, event.version));
    if (!q) return;

    if (event.mode === MatchmakingMode.BOTS) {
      const balance = this.qService.findBotsGame(q);
      this.makeGame(balance, q);
    } else {
      const balance = this.qService.findBalancedGame(q);
      this.makeGame(balance, q);
    }
  }


  private makeGame(balance: RoomBalance | undefined, q: QueueModel) {
    if (!balance) return;

    const [leftTeam, rightTeam] = balance.teams;
    this.logger.log(`We have a game in mode ${formatGameMode(q.mode)}`);
    q.removeAll([...leftTeam.parties, ...rightTeam.parties]);
    q.commit();

    this.logger.log(
      `Removed ${leftTeam.parties.length + rightTeam.parties.length} parties from queue`,
    );

    this.ebus.publish(new GameFoundEvent(balance, q.version, q.mode));
  }
}
