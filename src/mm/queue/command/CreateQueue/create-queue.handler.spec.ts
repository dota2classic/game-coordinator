import { Test, TestingModule } from "@nestjs/testing";
import { CreateQueueHandler } from "./create-queue.handler";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { CreateQueueCommand } from "mm/queue/command/CreateQueue/create-queue.command";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueCreatedEvent } from "gateway/gateway/events/queue-created.event";
import { QueueModel } from "mm/queue/model/queue.model";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { QueueProviders } from "mm/queue";
import { Dota2Version } from "../../../../gateway/gateway/shared-types/dota2version";

describe("CreateQueueHandler", () => {
  let handler: CreateQueueHandler;
  let ebus: EventBus;
  let cbus: CommandBus;
  let rep: QueueRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    handler = module.get<CreateQueueHandler>(CreateQueueHandler);
    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);
    rep = module.get<QueueRepository>(QueueRepository);

    cbus.register([CreateQueueHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("new queue", async () => {
    const mode = MatchmakingMode.SOLOMID;
    await cbus.execute(new CreateQueueCommand(mode, Dota2Version.Dota_684));
    expect(ebus).toEmit(new QueueCreatedEvent(mode, Dota2Version.Dota_684));
  });

  it("existing queue should not publish event", async () => {
    const mode = MatchmakingMode.SOLOMID;

    const q = new QueueModel(mode, Dota2Version.Dota_684);
    await rep.save(q.compId, q);

    await cbus.execute(new CreateQueueCommand(mode, Dota2Version.Dota_684));
    expect(ebus).toEmitNothing();
  });
});
