import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "src/@test/cqrs";
import { InviteToPartyHandler } from "src/mm/party/command/InvteToParty/invite-to-party.handler";
import { PartyProviders } from "src/mm/party";
import { InviteToPartyCommand } from "src/gateway/gateway/commands/invite-to-party.command";
import {printCalls, randomUser} from "src/@test/values";
import { PartyInviteCreatedEvent } from "src/gateway/gateway/events/party-invite-created.event";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { PartyCreatedEvent } from "src/mm/party/event/party-created.event";

describe("InviteToPartyHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...PartyProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);

    cbus.register([InviteToPartyHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should be defined", async () => {});

  it("should create party if not present and invite events", async () => {
    const u = randomUser();
    const u2 = randomUser();
    const id = await cbus.execute(new InviteToPartyCommand(u, u2));
    const party = await module.get(PartyRepository).findExistingParty(u);



    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyInviteCreatedEvent(id, party.id, u2),
    );
  });

});
