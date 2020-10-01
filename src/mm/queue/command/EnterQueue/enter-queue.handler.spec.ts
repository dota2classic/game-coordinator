import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "src/@test/cqrs";
import { EnterQueueHandler } from "src/mm/queue/command/EnterQueue/enter-queue.handler";
import { EnterQueueCommand } from "src/mm/queue/command/EnterQueue/enter-queue.command";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { QueueUpdateEvent } from "src/mm/queue/event/queue-update.event";
import { QueueProviders } from "src/mm/queue";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueModel } from "src/mm/queue/model/queue.model";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import {
  FoundGameParty,
  GameFoundEvent,
  PlayerInParty,
} from "src/mm/queue/event/game-found.event";
import { wait } from "src/@shared/wait";
import Mock = jest.Mock;
import { inspect } from "util";

describe("EnterQueueHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;

  let module: TestingModule;

  const createTestQ = async (mode: MatchmakingMode) => {
    const rep = module.get<QueueRepository>(QueueRepository);
    const q = new QueueModel(mode);
    return rep.save(q.mode, q);
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);
    cbus.register([EnterQueueHandler]);

    await createTestQ(MatchmakingMode.SOLOMID);
    await createTestQ(MatchmakingMode.RANKED);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should not enter queue if there is no queue", async () => {
    // remove all queues
    clearRepositories();
    const queueEntryId = await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity("1", 1000)],
        MatchmakingMode.SOLOMID,
      ),
    );
    expect(queueEntryId).toBeUndefined();
    expect(ebus).toEmitNothing();
  });

  it("should enter queue", async () => {
    const mode = MatchmakingMode.SOLOMID;

    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity("1", 1000)],
        mode,
      ),
    );
    expect(ebus).toEmit(new QueueUpdateEvent(mode));
  });

  it("Should find game", async () => {
    const mode = MatchmakingMode.SOLOMID;

    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [
          new PlayerInQueueEntity("1", 1000),
          new PlayerInQueueEntity("2", 1000),
        ],
        mode,
      ),
    );

    expect(ebus).toEmit(
      new GameFoundEvent(mode, [
        new FoundGameParty(
          "party",
          [
            new PlayerInQueueEntity("1", 1000),
            new PlayerInQueueEntity("2", 1000),
          ].map(p => new PlayerInParty(p.playerId, p.mmr)),
        ),
      ]),
      new QueueUpdateEvent(mode),
      new QueueUpdateEvent(mode),
    );
  });

  it("should handle duplicate enter queue", async () => {
    const mode = MatchmakingMode.SOLOMID;
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity("1", 1000)],
        mode,
      ),
    );
    // reset publishes
    ebus.publish = jest.fn();
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity("1", 1000)],
        mode,
      ),
    );
    expect(ebus).toEmitNothing();
  });

  it("should keep party in one queue only at a time", async () => {
    // enter ranked queue
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity("1", 1000)],
        MatchmakingMode.RANKED,
      ),
    );

    // enter solomid queue after
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity("1", 1000)],
        MatchmakingMode.SOLOMID,
      ),
    );


    // @ts-ignore
    // console.error(inspect(ebus.publish.mock.calls))
    expect(ebus).toEmit(
      new QueueUpdateEvent(MatchmakingMode.RANKED), // enter ranked queue
      new QueueUpdateEvent(MatchmakingMode.RANKED), // leave ranked queue
      new QueueUpdateEvent(MatchmakingMode.SOLOMID), // enter solomid
    );
  });
});
