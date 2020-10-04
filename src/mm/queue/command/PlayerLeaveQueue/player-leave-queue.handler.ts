import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { PlayerLeaveQueueCommand } from "src/gateway/gateway/commands/player-leave-queue.command";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";
import { PartyModel } from "src/mm/party/model/party.model";
import { uuid } from "src/@shared/generateID";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { LeaveQueueCommand } from "src/mm/queue/command/LeaveQueue/leave-queue.command";

@CommandHandler(PlayerLeaveQueueCommand)
export class PlayerLeaveQueueHandler
  implements ICommandHandler<PlayerLeaveQueueCommand> {
  private readonly logger = new Logger(PlayerLeaveQueueHandler.name);

  constructor(
    private readonly cbus: CommandBus,
    private readonly partyRepository: PartyRepository,
  ) {}

  async execute(command: PlayerLeaveQueueCommand) {
    const p = await this.getPartyOf(command.playerID);

    return this.cbus.execute(new LeaveQueueCommand(command.mode, p.id));
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
