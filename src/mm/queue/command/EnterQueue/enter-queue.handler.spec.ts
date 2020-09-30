import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories } from "src/@test/clearRepository";
import { TestEnvironment } from "src/@test/cqrsMock";
import { EnterQueueHandler } from "src/mm/queue/command/EnterQueue/enter-queue.handler";
import { EnterQueueCommand } from "src/mm/queue/command/EnterQueue/enter-queue.command";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { QueueUpdateEvent } from "src/mm/queue/event/queue-update.event";
import { QueueProviders } from "src/mm/queue";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueModel } from "src/mm/queue/model/queue.model";

describe("EnterQueueHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);
    cbus.register([EnterQueueHandler]);

    const rep = module.get<QueueRepository>(QueueRepository);
    const q = new QueueModel(MatchmakingMode.SOLOMID);
    await rep.save(q.mode, q);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should not enter queue if there is no queue", async () => {
    clearRepositories();
    const queueEntryId = await cbus.execute(
      new EnterQueueCommand("party", 1, MatchmakingMode.SOLOMID),
    );
    expect(queueEntryId).toBeUndefined();
    expect(ebus).toEmit();
  });

  it("Enter queue", async () => {
    const queueEntryId = await cbus.execute(
      new EnterQueueCommand("party", 1, MatchmakingMode.SOLOMID),
    );

    expect(ebus).toEmit(
      new QueueUpdateEvent(MatchmakingMode.SOLOMID, queueEntryId),
    );

  });

  it("duplicate enter queue", async () => {
    await cbus.execute(
      new EnterQueueCommand("party", 1, MatchmakingMode.SOLOMID),
    );
    // reset publishes
    ebus.publish = jest.fn();
    await cbus.execute(
      new EnterQueueCommand("party", 1, MatchmakingMode.SOLOMID),
    );
    expect(ebus).toEmit();
  });


});
