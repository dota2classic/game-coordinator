import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { LeavePartyHandler } from "mm/party/command/LeaveParty/leave-party.handler";
import { PartyProviders } from "mm/party";
import { LeavePartyCommand } from "mm/party/command/LeaveParty/leave-party.command";
import { randomUser } from "@test/values";
import { PartyRepository } from "mm/party/repository/party.repository";
import { PartyCreatedEvent } from "mm/party/event/party-created.event";
import { PartyUpdatedEvent } from "gateway/gateway/events/party/party-updated.event";

describe("LeavePartyHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        // ...QueueProviders,
        ...PartyProviders,
        ...TestEnvironment(),
      ],
    }).compile();

    cbus = module.get(CommandBus);
    ebus = module.get(EventBus);

    cbus.register([LeavePartyHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should be defined", async () => {});

  it("should not leave from party if there is no party", async () => {
    const u = randomUser();
    await cbus.execute(new LeavePartyCommand(u));
    expect(ebus).toEmitNothing();
  });

  it("should not leave from party if its single person party", async () => {
    const u = randomUser();
    const rep = module.get(PartyRepository);
    const p = await rep.getPartyOf(u);
    await cbus.execute(new LeavePartyCommand(u));
    expect(ebus).toEmit(new PartyCreatedEvent(p.id, p.leader, [p.leader]));
  });

  it("should leave from party if there are other players", async () => {
    const u = randomUser();
    const u2 = randomUser();
    const rep = module.get(PartyRepository);
    const p = await rep.getPartyOf(u);
    p.add(u2);
    await cbus.execute(new LeavePartyCommand(u2));

    const newPartyOfu2 = Array.from(rep["cache"].values()).find(
      t => t.leader.value === u2.value,
    );

    expect(ebus).toEmit(
      // GetParty of u
      new PartyCreatedEvent(p.id, p.leader, [u]),
      // Party.add()
      new PartyUpdatedEvent(p.id, p.leader, [u, u2]),
      // Leave from party1
      new PartyUpdatedEvent(p.id, p.leader, [u]),
      // PartyCreated of u2(single)
      new PartyCreatedEvent(newPartyOfu2.id, u2, [u2]),
      // Party updated of u2
      new PartyUpdatedEvent(newPartyOfu2.id, u2, [u2]),
    );
  });

  it("should dismiss party if leader left", async () => {
    const u = randomUser();
    const u2 = randomUser();
    const rep = module.get(PartyRepository);
    const p = await rep.getPartyOf(u);
    p.add(u2);
    await cbus.execute(new LeavePartyCommand(u));

    const newPartyOfu2 = Array.from(rep["cache"].values()).find(
      t => t.leader.value === u2.value,
    );

    expect(ebus).toEmit(
      // Create party
      new PartyCreatedEvent(p.id, u, [u]),
      // Add u2
      new PartyUpdatedEvent(p.id, u, [u, u2]),
      // Leftover party of u
      new PartyUpdatedEvent(p.id, u, [u]),
      // Create party of removed players
      new PartyCreatedEvent(newPartyOfu2.id, u2, [u2]),
      // And Update
      new PartyUpdatedEvent(newPartyOfu2.id, u2, [u2]),
    );
  });
});
