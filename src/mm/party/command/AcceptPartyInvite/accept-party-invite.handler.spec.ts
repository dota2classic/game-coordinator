import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus, EventPublisher } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { AcceptPartyInviteHandler } from "mm/party/command/AcceptPartyInvite/accept-party-invite.handler";
import { PartyProviders } from "mm/party";
import { PartyInvitationRepository } from "mm/party/repository/party-invitation.repository";
import { PartyInvitationModel } from "mm/party/model/party-invitation.model";
import { randomUser } from "@test/values";
import { PartyRepository } from "mm/party/repository/party.repository";
import { AcceptPartyInviteCommand } from "mm/party/command/AcceptPartyInvite/accept-party-invite.command";
import { PartyCreatedEvent } from "mm/party/event/party-created.event";
import { PartyUpdatedEvent } from "gateway/gateway/events/party/party-updated.event";
import { PartyInviteResultEvent } from "gateway/gateway/events/party/party-invite-result.event";
import { PartyDeletedEvent } from "gateway/gateway/events/party/party-deleted.event";
import { prepareModels } from "../../../../main";

describe("AcceptPartyInviteHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...PartyProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get(CommandBus);
    ebus = module.get(EventBus);

    cbus.register([AcceptPartyInviteHandler]);

    const publisher = module.get(EventPublisher);
    prepareModels(publisher);
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
    const inv = new PartyInvitationModel(party.id, u2, u);
    await rep.save(inv.id, inv);

    await cbus.execute(new AcceptPartyInviteCommand(inv.id, true));

    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyUpdatedEvent(party.id, u, [u, u2]),
      new PartyInviteResultEvent(inv.id, u2, true, u),
    );
  });

  it("should decline if there is invite", async () => {
    const rep = module.get(PartyInvitationRepository);
    const pRep = module.get(PartyRepository);
    const u = randomUser();
    const u2 = randomUser();
    const party = await pRep.getPartyOf(u);
    const inv = new PartyInvitationModel(party.id, u2, u);
    await rep.save(inv.id, inv);

    await cbus.execute(new AcceptPartyInviteCommand(inv.id, false));

    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyInviteResultEvent(inv.id, u2, false, u),
    );
  });

  it("should make 1 party of two", async () => {
    const rep = module.get(PartyInvitationRepository);
    const pRep = module.get(PartyRepository);
    const u = randomUser();
    const u2 = randomUser();
    const party = await pRep.getPartyOf(u);
    const party2 = await pRep.getPartyOf(u2);

    const inv = new PartyInvitationModel(party.id, u2, u);
    await rep.save(inv.id, inv);

    await cbus.execute(new AcceptPartyInviteCommand(inv.id, false));

    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyCreatedEvent(party2.id, u2, [u2]),
      new PartyDeletedEvent(party2.id),
      new PartyInviteResultEvent(inv.id, u2, false, u),
    );

    await expect(pRep.all()).resolves.toHaveLength(1);
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
    party2.uncommit();

    const inv = new PartyInvitationModel(party.id, u2, u);
    await rep.save(inv.id, inv);

    await cbus.execute(new AcceptPartyInviteCommand(inv.id, false));

    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PartyCreatedEvent(party2.id, u2, [u2]),
      new PartyDeletedEvent(party2.id),
      new PartyInviteResultEvent(inv.id, u2, false, u),
    );

    await expect(pRep.all()).resolves.toHaveLength(1);
  });
});
