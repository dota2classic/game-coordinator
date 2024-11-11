import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { LeavePartyCommand } from "mm/party/command/LeaveParty/leave-party.command";
import { PartyRepository } from "mm/party/repository/party.repository";

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


    // Not only we need to update previous party
    existing.remove(command.playerId);
    existing.commit();

    // But also update his new(single) party
    const p = await this.partyRepository.getPartyOf(command.playerId)
    p.updated()
    p.commit()
  }
}
