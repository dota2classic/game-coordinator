import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { PlayerLeaveQueueCommand } from "src/gateway/gateway/commands/player-leave-queue.command";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";
import { PartyModel } from "src/mm/party/model/party.model";
import { uuid } from "src/@shared/generateID";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { PlayerLeaveQueueResolvedEvent } from "src/mm/queue/event/player-leave-queue-resolved.event";

@CommandHandler(PlayerLeaveQueueCommand)
export class PlayerLeaveQueueHandler
  implements ICommandHandler<PlayerLeaveQueueCommand> {
  private readonly logger = new Logger(PlayerLeaveQueueHandler.name);

  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
  ) {}

  async execute(command: PlayerLeaveQueueCommand) {
    const p = await this.getPartyOf(command.playerID);

    return this.ebus.publish(
      new PlayerLeaveQueueResolvedEvent(p.id, command.mode),
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
