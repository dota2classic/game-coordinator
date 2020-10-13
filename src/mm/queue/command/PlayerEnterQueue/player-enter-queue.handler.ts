import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { PlayerEnterQueueCommand } from "src/gateway/gateway/commands/player-enter-queue.command";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";
import { PartyModel } from "src/mm/party/model/party.model";
import { uuid } from "src/@shared/generateID";
import { PlayerEnterQueueResolvedEvent } from "src/mm/queue/event/player-enter-queue-resolved.event";

@CommandHandler(PlayerEnterQueueCommand)
export class PlayerEnterQueueHandler
  implements ICommandHandler<PlayerEnterQueueCommand> {
  private readonly logger = new Logger(PlayerEnterQueueHandler.name);

  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
  ) {}

  async execute(command: PlayerEnterQueueCommand) {
    const p = await this.getPartyOf(command.playerID);

    this.ebus.publish(
      new PlayerEnterQueueResolvedEvent(
        p.id,
        p.players.map(t => ({
          playerId: t,
          mmr: 3000, // todo
        })),
        command.mode,
      ),
    );
  }

  private async getPartyOf(id: PlayerId) {
    const parties = await this.partyRepository.all();
    const party = parties.find(it => it.players.find(z => z == id));

    if (!party) {
      const p = new PartyModel(uuid(), id, [id]);
      await this.partyRepository.save(p.id, p);
      p.created();
      p.commit();

      return p;
    }
    return party;
  }
}