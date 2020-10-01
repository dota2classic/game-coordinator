import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { EnterQueueCommand } from "src/mm/queue/command/EnterQueue/enter-queue.command";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";
import { QueueEntryRepository } from "src/mm/queue/repository/queue-entry.repository";
import { QueueModel } from "src/mm/queue/model/queue.model";
import { RoomSizes } from "src/mm/room/model/entity/room-size";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { PlayerRepository } from "src/mm/player/repository/player.repository";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import { QueueService } from "src/mm/queue/service/queue.service";
import { GameFoundEvent } from "src/mm/queue/event/game-found.event";

@CommandHandler(EnterQueueCommand)
export class EnterQueueHandler implements ICommandHandler<EnterQueueCommand> {
  private readonly logger = new Logger(EnterQueueHandler.name);

  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly queueEntryRepository: QueueEntryRepository,

    //
    private readonly partyRepository: PartyRepository,
    private readonly playerRepository: PlayerRepository,
    //

    private readonly ebus: EventBus,
    private readonly queueService: QueueService,
  ) {}

  async execute({ partyId, mode, size }: EnterQueueCommand) {
    const q = await this.queueRepository.get(mode);
    if (!q) return;

    const party = await this.partyRepository.get(partyId);

    if (!party) return;

    const mappedPlayers = await Promise.all(
      party.players.map(async pid => {
        const player = await this.playerRepository.get(pid);
        return new PlayerInQueueEntity(pid, player.ratingInfo.mmr);
      }),
    );

    const entry = new QueueEntryModel(partyId, mode, mappedPlayers);
    await this.queueEntryRepository.save(entry.id, entry);

    q.addEntry(entry);
    await this.checkForGame(q);


    q.commit();
    return entry.id;
  }

  private async checkForGame(q: QueueModel) {
    // if not enough players, return immediately
    if (q.size < RoomSizes[q.mode]) return;

    const game = this.queueService.findGame(q);

    if (!game) return;

    q.removeAll(game.entries);

    this.ebus.publish(
      new GameFoundEvent(
        q.mode,
        game.entries.map(t => t.partyID),
      ),
    );
  }
}
