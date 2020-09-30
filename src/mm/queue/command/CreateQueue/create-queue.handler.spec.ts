import { Test, TestingModule } from "@nestjs/testing";
import { CreateQueueHandler } from "./create-queue.handler";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { CreateQueueCommand } from "src/mm/queue/command/CreateQueue/create-queue.command";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { QueueCreatedEvent } from "src/mm/queue/event/queue-created.event";
import { QueueModel } from "src/mm/queue/model/queue.model";
import { clearRepositories } from "src/@test/clearRepository";
import { commandHandlerTest, expectEvents } from "src/@test/expectEvents";
import { TestEnvironment } from "src/@test/cqrsMock";
import { QueueProviders } from "src/mm/queue";


describe('CreateQueueHandler', () => {
  let handler: CreateQueueHandler;
  let events$: EventBus;
  let cbus: CommandBus;
  let rep: QueueRepository;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ...QueueProviders,
        ...TestEnvironment()
      ],
    }).compile();

    handler = module.get<CreateQueueHandler>(CreateQueueHandler);
    cbus = module.get<CommandBus>(CommandBus);
    events$ = module.get<EventBus>(EventBus);
    rep = module.get<QueueRepository>(QueueRepository);

    cbus.register([CreateQueueHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it('new queue', async () => {
    const mode = MatchmakingMode.SOLOMID;

    await commandHandlerTest(events$, cbus)(
      new CreateQueueCommand(mode),
      [new QueueCreatedEvent(mode)]
    )

  });

  it('existing queue should not publish event', async () => {
    const mode = MatchmakingMode.SOLOMID;


    const q = new QueueModel(mode);
    await rep.save(mode, q);

    await commandHandlerTest(events$, cbus)(
      new CreateQueueCommand(mode),
      []
    )

  });
});
