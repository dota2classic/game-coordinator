import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { EnterQueueCommand } from "mm/queue/command/EnterQueue/enter-queue.command";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { QueueModel } from "mm/queue/model/queue.model";
import { QueueService } from "mm/queue/service/queue.service";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import {
  MatchmakingMode,
  RoomSizes,
} from "gateway/gateway/shared-types/matchmaking-mode";
import { EnterQueueDeclinedEvent } from "gateway/gateway/events/mm/enter-queue-declined.event";
import { PartyId } from "gateway/gateway/shared-types/party-id";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { BalanceService } from "mm/queue/service/balance.service";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";

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
    version: Dota2Version,
  ) {
    // here we check for ban status

    const bannedPlayers = players.filter(
      (player) => player.banStatus?.isBanned,
    );
    if (bannedPlayers.length > 0 && mode !== MatchmakingMode.BOTS) {
      // if there are banned players in party, we can't let them in
      this.ebus.publish(
        new EnterQueueDeclinedEvent(
          partyId,
          players.map((t) => t.playerId),
          bannedPlayers.map((t) => t.playerId),
          mode,
          version,
        ),
      );

      return true;
    }

    return false;
  }

  // private checkForNewbies(
  //   partyId: PartyId,
  //   mode: MatchmakingMode,
  //   players: PlayerInQueueEntity[],
  //   version: Dota2Version,
  // ) {
  //   if (mode !== MatchmakingMode.RANKED) return false;
  //   const newPlayers = players.filter(player => player.unrankedGamesLeft > 0);
  //   if (newPlayers.length > 0) {
  //     // if there are banned players in party, we can't let them in
  //     this.ebus.publish(
  //       new EnterRankedQueueDeclinedEvent(
  //         partyId,
  //         players.map(t => t.playerId),
  //         newPlayers.map(t => t.playerId),
  //         mode,
  //         version,
  //       ),
  //     );
  //
  //     return true;
  //   }
  //
  //   return false;
  // }
  async execute({ partyId, mode, players, version }: EnterQueueCommand) {
    const q = await this.queueRepository.get(QueueRepository.id(mode, version));
    if (!q) return;

    if (this.checkForBans(partyId, mode, players, version)) {
      // if can't go cause of bans we return
      return;
    }

    const allQueues = await this.queueRepository.all();

    // remove from other queues
    allQueues
      .filter((q) => q.mode !== mode || q.version !== version)
      .forEach((q) => {
        q.removeEntry(partyId);
        q.commit();
      });

    const entry = new QueueEntryModel(partyId, mode, version, players);

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
    if (q.mode === MatchmakingMode.BOTS) return;

    const game = this.queueService.findGame(q);

    if (!game) return;
    try {
      const balance = BalanceService.genericBalance(game.mode, game.entries);

      q.removeAll(game.entries);
      q.commit();

      this.ebus.publish(new GameFoundEvent(balance, q.version, game.mode));
    } catch (e) {
      console.log(e);
    }
  }
}
