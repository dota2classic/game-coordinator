import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { LeavePartyCommand } from "mm/party/command/LeaveParty/leave-party.command";
import { PartyRepository } from "mm/party/repository/party.repository";
import { PartyModel } from "../../model/party.model";

@CommandHandler(LeavePartyCommand)
export class LeavePartyHandler implements ICommandHandler<LeavePartyCommand> {
  private readonly logger = new Logger(LeavePartyHandler.name);

  constructor(
    private readonly partyRepository: PartyRepository,
    private readonly ebus: EventBus,
    private readonly cbus: CommandBus,
  ) {}

  async execute(command: LeavePartyCommand) {
    const existing = (await this.partyRepository.findExistingParty(
      command.playerId,
    )) as PartyModel | undefined;
    if (!existing) {
      // if no party, do nothing
      return;
    }


    // Not only we need to update previous party
    const affectedPlayers = existing.remove(command.playerId);
    existing.commit();


    for (let affectedPlayer of affectedPlayers) {
      // But also update his new(single) party
      const p = await this.partyRepository.getPartyOf(affectedPlayer)
      p.updated()
      p.commit()
    }


  }
}
