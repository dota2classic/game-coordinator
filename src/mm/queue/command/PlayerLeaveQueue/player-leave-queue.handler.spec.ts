import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { PlayerLeaveQueueHandler } from "mm/queue/command/PlayerLeaveQueue/player-leave-queue.handler";
import { QueueProviders } from "mm/queue";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { PartyCreatedEvent } from "mm/party/event/party-created.event";
import { PartyRepository } from "mm/party/repository/party.repository";
import { PlayerLeaveQueueResolvedEvent } from "mm/queue/event/player-leave-queue-resolved.event";
import { PlayerLeaveQueueCommand } from "gateway/gateway/commands/player-leave-queue.command";
import { randomUser } from "@test/values";

describe("PlayerLeaveQueueHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;
  let rep: PartyRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);
    const qbus = module.get<EventBus>(EventBus);
    rep = module.get<PartyRepository>(PartyRepository);

    cbus.register([PlayerLeaveQueueHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should emit leave queue", async () => {
    const u = randomUser();
    await cbus.execute(new PlayerLeaveQueueCommand(u, MatchmakingMode.SOLOMID));
    const party = (await rep.all())[0];
    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PlayerLeaveQueueResolvedEvent(party.id, MatchmakingMode.SOLOMID),
    );
  });
});
