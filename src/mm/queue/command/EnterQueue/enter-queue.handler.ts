import {CommandHandler, EventBus, ICommandHandler} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {EnterQueueCommand} from "src/mm/queue/command/EnterQueue/enter-queue.command";
import {QueueRepository} from "src/mm/queue/repository/queue.repository";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";
import {QueueModel} from "src/mm/queue/model/queue.model";
import {QueueService} from "src/mm/queue/service/queue.service";
import {FoundGameParty, GameFoundEvent, PlayerInParty,} from "src/mm/queue/event/game-found.event";
import {RoomSizes} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {EnterQueueDeclinedEvent} from "src/gateway/gateway/events/mm/enter-queue-declined.event";

@CommandHandler(EnterQueueCommand)
export class EnterQueueHandler implements ICommandHandler<EnterQueueCommand> {
  private readonly logger = new Logger(EnterQueueHandler.name);

  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly ebus: EventBus,
    private readonly queueService: QueueService,
  ) {}

  async execute({ partyId, mode, players }: EnterQueueCommand) {
    const q = await this.queueRepository.get(mode);
    if (!q) return;

    // here we check for ban status

    const bannedPlayers = players.filter(player => player.banStatus?.isBanned);
    if (bannedPlayers.length > 0) {
      // if there are banned players in party, we can't let them in
      this.ebus.publish(
        new EnterQueueDeclinedEvent(
          partyId,
          players.map(t => t.playerId),
          bannedPlayers.map(t => t.playerId),
          mode,
        ),
      );

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

    const entry = new QueueEntryModel(partyId, mode, players);
    q.addEntry(entry);
    q.commit();

    await this.checkForGame(q);
    return entry.id;
  }

  private async checkForGame(q: QueueModel) {
    // if not enough players, return immediately
    if (q.size < RoomSizes[q.mode]) return;

    const game = this.queueService.findGame(q);

    if (!game) return;

    q.removeAll(game.entries);
    q.commit();

    this.ebus.publish(
      new GameFoundEvent(
        q.mode,
        game.entries.map(
          t =>
            new FoundGameParty(
              t.partyID,
              t.players.map(
                p =>
                  new PlayerInParty(
                    p.playerId,
                    p.mmr,
                    p.recentWinrate,
                    p.gamesPlayed,
                  ),
              ),
            ),
        ),
      ),
    );
  }
}
