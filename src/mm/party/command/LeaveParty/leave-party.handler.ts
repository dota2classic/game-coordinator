import {CommandBus, CommandHandler, EventBus, ICommandHandler,} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {LeavePartyCommand} from "src/gateway/gateway/commands/leave-party.command";
import {PartyRepository} from "src/mm/party/repository/party.repository";

@CommandHandler(LeavePartyCommand)
export class LeavePartyHandler implements ICommandHandler<LeavePartyCommand> {
  private readonly logger = new Logger(LeavePartyHandler.name);

  constructor(
    private readonly partyRepository: PartyRepository,
    private readonly ebus: EventBus,
    private readonly cbus: CommandBus,
  ) {}

  async execute(command: LeavePartyCommand) {
    const existing = await this.partyRepository.findExistingParty(
      command.playerId,
    );
    if (!existing) {
      // if no party, do nothing
      return;
    }

    existing.remove(command.playerId);
  }
}
