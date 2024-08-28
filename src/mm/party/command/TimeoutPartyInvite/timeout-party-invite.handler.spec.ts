import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { TimeoutPartyInviteHandler } from "mm/party/command/TimeoutPartyInvite/timeout-party-invite.handler";
import { PartyProviders } from "mm/party";
import { PartyInvitationRepository } from "mm/party/repository/party-invitation.repository";
import { PartyInvitationModel } from "mm/party/model/party-invitation.model";
import { uuid } from "@shared/generateID";
import { randomUser } from "@test/values";
import { PartyInviteExpiredEvent } from "gateway/gateway/events/party/party-invite-expired.event";
import { TimeoutPartyInviteCommand } from "mm/party/command/TimeoutPartyInvite/timeout-party-invite.command";
import { PartyInviteResultEvent } from "gateway/gateway/events/party/party-invite-result.event";

describe("TimeoutPartyInviteHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...PartyProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);

    cbus.register([TimeoutPartyInviteHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should be defined", async () => {});

  it("should emit event if there is invitation", async () => {
    const u = randomUser();
    const u2 = randomUser();
    const r = module.get(PartyInvitationRepository);
    const inv = new PartyInvitationModel(uuid(), u, u2);
    await r.save(inv.id, inv);

    await cbus.execute(new TimeoutPartyInviteCommand(inv.id));

    expect(ebus).toEmit(
      new PartyInviteResultEvent(inv.id, u, false, u2),
      new PartyInviteExpiredEvent(inv.id, u, inv.partyId, u2),
    );
  });

  it("should not emit event if there is no invitation", async () => {
    await cbus.execute(new TimeoutPartyInviteCommand("no-such-id"));

    expect(ebus).toEmitNothing();
  });
});
