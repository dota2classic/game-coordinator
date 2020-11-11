import {Test, TestingModule} from "@nestjs/testing";
import {CommandBus, EventBus} from "@nestjs/cqrs";
import {clearRepositories, TestEnvironment} from "src/@test/cqrs";
import {TimeoutPartyInviteHandler} from "src/mm/party/command/TimeoutPartyInvite/timeout-party-invite.handler";
import {PartyProviders} from "src/mm/party";
import {PartyInvitationRepository} from "src/mm/party/repository/party-invitation.repository";
import {PartyInvitationModel} from "src/mm/party/model/party-invitation.model";
import {uuid} from "src/@shared/generateID";
import {randomUser} from "src/@test/values";
import {PartyInviteExpiredEvent} from "src/gateway/gateway/events/party/party-invite-expired.event";
import {TimeoutPartyInviteCommand} from "src/mm/party/command/TimeoutPartyInvite/timeout-party-invite.command";

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
    const r = module.get(PartyInvitationRepository);
    const inv = new PartyInvitationModel(uuid(), u);
    await r.save(inv.id, inv);

    await cbus.execute(new TimeoutPartyInviteCommand(inv.id));

    expect(ebus).toEmit(new PartyInviteExpiredEvent(inv.id));
  });

  it("should not emit event if there is no invitation", async () => {
    await cbus.execute(new TimeoutPartyInviteCommand("no-such-id"));

    expect(ebus).toEmitNothing();
  });
});
