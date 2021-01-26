import {CommandHandler, EventBus, ICommandHandler} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {EnterQueueCommand} from "src/mm/queue/command/EnterQueue/enter-queue.command";
import {QueueRepository} from "src/mm/queue/repository/queue.repository";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";
import {QueueModel} from "src/mm/queue/model/queue.model";
import {QueueService} from "src/mm/queue/service/queue.service";
import {GameFoundEvent,} from "src/mm/queue/event/game-found.event";
import {MatchmakingMode, RoomSizes,} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {EnterQueueDeclinedEvent} from "src/gateway/gateway/events/mm/enter-queue-declined.event";
import {PartyId} from "src/gateway/gateway/shared-types/party-id";
import {PlayerInQueueEntity} from "src/mm/queue/model/entity/player-in-queue.entity";
import {EnterRankedQueueDeclinedEvent} from "src/gateway/gateway/events/mm/enter-ranked-queue-declined.event";
import {BalanceService} from "src/mm/queue/service/balance.service";

@CommandHandler(EnterQueueCommand)
export class EnterQueueHandler implements ICommandHandler<EnterQueueCommand> {
  private readonly logger = new Logger(EnterQueueHandler.name);

  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly ebus: EventBus,
    private readonly queueService: QueueService,
    private readonly balanceService: BalanceService,
  ) {}

  private checkForBans(
    partyId: PartyId,
    mode: MatchmakingMode,
    players: PlayerInQueueEntity[],
  ) {
    // here we check for ban status

    const bannedPlayers = players.filter(player => player.banStatus?.isBanned);
    if (bannedPlayers.length > 0 && mode !== MatchmakingMode.BOTS) {
      // if there are banned players in party, we can't let them in
      this.ebus.publish(
        new EnterQueueDeclinedEvent(
          partyId,
          players.map(t => t.playerId),
          bannedPlayers.map(t => t.playerId),
          mode,
        ),
      );

      return true;
    }

    return false;
  }

  private checkForNewbies(
    partyId: PartyId,
    mode: MatchmakingMode,
    players: PlayerInQueueEntity[],
  ) {
    if (mode !== MatchmakingMode.RANKED) return false;
    const newPlayers = players.filter(player => player.unrankedGamesLeft > 0);
    if (newPlayers.length > 0) {
      // if there are banned players in party, we can't let them in
      this.ebus.publish(
        new EnterRankedQueueDeclinedEvent(
          partyId,
          players.map(t => t.playerId),
          newPlayers.map(t => t.playerId),
          mode,
        ),
      );

      return true;
    }

    return false;
  }
  async execute({ partyId, mode, players }: EnterQueueCommand) {
    const q = await this.queueRepository.get(mode);
    if (!q) return;

    if (this.checkForBans(partyId, mode, players)) {
      // if can't go cause of bans we return
      return;
    }

    if (this.checkForNewbies(partyId, mode, players)) {
      return;
    }

    const allQueues = await this.queueRepository.all();

    // remove from other queues
    allQueues
      .filter(q => q.mode !== mode)
      .forEach(q => {
        q.removeEntry(partyId);
        q.commit();
      });

    const score = BalanceService.getTotalScore(players);
    const entry = new QueueEntryModel(partyId, mode, players, score);

    q.addEntry(entry);
    q.commit();

    await this.checkForGame(q);
    return entry.id;
  }

  private async checkForGame(q: QueueModel) {
    // This mode is exclusive and uses interval-based game findings

    // we go for cycle based queue
    if (q.mode === MatchmakingMode.RANKED) return;
    if (q.mode === MatchmakingMode.UNRANKED) return;
    // todo uncomment
    // if (q.mode === MatchmakingMode.BOTS && q.size < RoomSizes[q.mode]) return;
    // if not enough players, return immediately
    if (q.size < RoomSizes[q.mode]) return;
    // if (q.mode !== MatchmakingMode.BOTS && q.size < RoomSizes[q.mode]) return;


    const game = this.queueService.findGame(q);

    if (!game) return;
    try {
      const balance = this.balanceService.genericBalance(
        game.mode,
        game.entries,
      );


      q.removeAll(game.entries);
      q.commit();

      this.ebus.publish(new GameFoundEvent(balance));
    } catch (e) {}
  }
}
