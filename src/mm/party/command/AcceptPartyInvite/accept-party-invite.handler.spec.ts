import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus, EventPublisher } from "@nestjs/cqrs";
import { TestEnvironment, clearRepositories } from "src/@test/cqrs";
import { AcceptPartyInviteHandler } from "src/mm/party/command/AcceptPartyInvite/accept-party-invite.handler";
import { PartyProviders } from "src/mm/party";
import { PartyInvitationRepository } from "src/mm/party/repository/party-invitation.repository";
import { PartyInvitationModel } from "src/mm/party/model/party-invitation.model";
import { printCalls, randomUser } from "src/@test/values";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { AcceptPartyInviteCommand } from "src/mm/party/command/AcceptPartyInvite/accept-party-invite.command";
import { PartyInviteAcceptedEvent } from "src/gateway/gateway/events/party/party-invite-accepted.event";
import { PartyCreatedEvent } from "src/mm/party/event/party-created.event";
import { PartyUpdatedEvent } from "src/gateway/gateway/events/party/party-updated.event";
import {PartyInviteResultEvent} from "src/gateway/gateway/events/party/party-invite-result.event";
import {PartyDeletedEvent} from "src/gateway/gateway/events/party/party-deleted.event";

describe("AcceptPartyInviteHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...PartyProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);

    cbus.register([AcceptPartyInviteHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should be defined", async () => {});

  it("should accept if there is invite", async () => {
    const rep = module.get(PartyInvitationRepository);
    const pRep = module.get(PartyRepository);
    const u = randomUser();
    const u2 = randomUser();
    const party = await pRep.getPartyOf(u);
    const inv = new PartyInvitationModel(party.id, u2);
    await rep.save(inv.id, inv);

    await cbus.execute(new AcceptPartyInviteCommand(inv.id, true));

    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyUpdatedEvent(party.id, u, [u, u2]),
      new PartyInviteResultEvent(inv.id, u2, true),
    );
  });

  it("should decline if there is invite", async () => {
    const rep = module.get(PartyInvitationRepository);
    const pRep = module.get(PartyRepository);
    const u = randomUser();
    const u2 = randomUser();
    const party = await pRep.getPartyOf(u);
    const inv = new PartyInvitationModel(party.id, u2);
    await rep.save(inv.id, inv);

    await cbus.execute(new AcceptPartyInviteCommand(inv.id, false));

    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyInviteResultEvent(inv.id, u2, false),
    );
  });


  it("should make 1 party of two", async () => {
    const rep = module.get(PartyInvitationRepository);
    const pRep = module.get(PartyRepository);
    const u = randomUser();
    const u2 = randomUser();
    const party = await pRep.getPartyOf(u);
    const party2 = await pRep.getPartyOf(u2);

    const inv = new PartyInvitationModel(party.id, u2);
    await rep.save(inv.id, inv);

    await cbus.execute(new AcceptPartyInviteCommand(inv.id, false));

    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyCreatedEvent(party2.id, u2, [u2]),
      new PartyDeletedEvent(party2.id),
      new PartyInviteResultEvent(inv.id, u2, false),
    );

    await expect(pRep.all()).resolves.toHaveLength(1)
  });


  it("case when party invite to a user in full party", async () => {
    const rep = module.get(PartyInvitationRepository);
    const pRep = module.get(PartyRepository);
    const u = randomUser();
    const u2 = randomUser();
    const u3 = randomUser();
    const party = await pRep.getPartyOf(u);
    const party2 = await pRep.getPartyOf(u2);

    party2.add(u3);

    const inv = new PartyInvitationModel(party.id, u2);
    await rep.save(inv.id, inv);

    await cbus.execute(new AcceptPartyInviteCommand(inv.id, false));

    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyCreatedEvent(party2.id, u2, [u2]),
      new PartyUpdatedEvent(party2.id, u2, [u2, u3]),
      new PartyUpdatedEvent(party2.id, u2, [u2]),
      new PartyDeletedEvent(party2.id),
      new PartyInviteResultEvent(inv.id, u2, false),
    );

    await expect(pRep.all()).resolves.toHaveLength(1)
  });
});
