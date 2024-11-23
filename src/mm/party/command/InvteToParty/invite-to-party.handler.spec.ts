import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { InviteToPartyHandler } from "mm/party/command/InvteToParty/invite-to-party.handler";
import { PartyProviders } from "mm/party";
import { InviteToPartyCommand } from "mm/party/command/InvteToParty/invite-to-party.command";
import { randomUser } from "@test/values";
import { PartyInviteCreatedEvent } from "gateway/gateway/events/party/party-invite-created.event";
import { PartyRepository } from "mm/party/repository/party.repository";
import { PartyCreatedEvent } from "mm/party/event/party-created.event";

describe("InviteToPartyHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...PartyProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get(CommandBus);
    ebus = module.get(EventBus);

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
      new PartyInviteCreatedEvent(id, party.id, party.leader, u2),
    );
  });
});
