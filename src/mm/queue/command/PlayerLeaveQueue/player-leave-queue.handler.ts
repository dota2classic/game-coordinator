import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { PlayerLeaveQueueCommand } from "gateway/gateway/commands/player-leave-queue.command";
import { PartyRepository } from "mm/party/repository/party.repository";
import { PlayerLeaveQueueResolvedEvent } from "mm/queue/event/player-leave-queue-resolved.event";

@CommandHandler(PlayerLeaveQueueCommand)
export class PlayerLeaveQueueHandler
  implements ICommandHandler<PlayerLeaveQueueCommand> {
  private readonly logger = new Logger(PlayerLeaveQueueHandler.name);

  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
  ) {}

  async execute(command: PlayerLeaveQueueCommand) {
    try {
      const p = await this.partyRepository.getPartyOf(command.playerID);
      return this.ebus.publish(
        new PlayerLeaveQueueResolvedEvent(p.id, command.mode, command.version),
      );
    } catch (e) {}
  }
}
