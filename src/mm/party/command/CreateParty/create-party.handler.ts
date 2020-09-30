import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { CreatePartyCommand } from "src/mm/party/command/CreateParty/create-party.command";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { PartyModel } from "src/mm/party/model/party.model";
import { v4 as uuid } from "uuid";
import { PartyCreatedEvent } from "src/mm/party/event/party-created.event";

@CommandHandler(CreatePartyCommand)
export class CreatePartyHandler implements ICommandHandler<CreatePartyCommand> {
  private readonly logger = new Logger(CreatePartyHandler.name);

  constructor(
    private readonly partyRepository: PartyRepository,
    private readonly ebus: EventBus,
  ) {}

  async execute({ playerID }: CreatePartyCommand) {
    const existing = await this.partyRepository.findExistingParty(playerID);
    if (existing) return existing;

    const party = new PartyModel(uuid(), playerID, [playerID]);
    await this.partyRepository.save(party.id, party);

    this.ebus.publish(new PartyCreatedEvent(party.id, playerID));

    return party.id;
  }
}
