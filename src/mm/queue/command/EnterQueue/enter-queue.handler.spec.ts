import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "src/@test/cqrs";
import { EnterQueueHandler } from "src/mm/queue/command/EnterQueue/enter-queue.handler";
import { EnterQueueCommand } from "src/mm/queue/command/EnterQueue/enter-queue.command";
import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { QueueUpdatedEvent } from "src/gateway/gateway/events/queue-updated.event";
import { QueueProviders } from "src/mm/queue";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueModel } from "src/mm/queue/model/queue.model";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import {
  FoundGameParty,
  GameFoundEvent,
} from "src/mm/queue/event/game-found.event";
import { randomUser } from "src/@test/values";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";
import { GameCheckCycleEvent } from "src/mm/queue/event/game-check-cycle.event";
import { GameCheckCycleHandler } from "src/mm/queue/event-handler/game-check-cycle.handler";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";

const u1 = randomUser();
const u2 = randomUser();
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
    await createTestQ(MatchmakingMode.UNRANKED);
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
        [new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0)],
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
        [new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0)],
        mode,
      ),
    );
    expect(ebus).toEmit(new QueueUpdatedEvent(mode));
  });

  it("Should find game", async () => {
    const mode = MatchmakingMode.SOLOMID;

    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [
          new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0),
          new PlayerInQueueEntity(u2, 1000, 0.5, 100, undefined, 0),
        ],
        mode,
      ),
    );

    expect(ebus).toEmit(
      new QueueUpdatedEvent(mode), // add first
      new QueueUpdatedEvent(mode), // clear
      new GameFoundEvent(mode, [
        new QueueEntryModel(
          "party",
          mode,
          [
            new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0),
            new PlayerInQueueEntity(u2, 1000, 0.5, 100, undefined, 0),
          ],
          0,
        ),
      ]),
    );
  });

  it("Should find 5x5 game", async () => {
    const mode = MatchmakingMode.UNRANKED;

    const players: PlayerId[] = [];
    for (let i = 0; i < 10; i++) {
      const u = randomUser();
      players.push(u);
    }

    let i = 0;
    for (const player of players) {
      await cbus.execute(
        new EnterQueueCommand(
          `party${i++}`,
          [new PlayerInQueueEntity(player, 3000, 0.5, 1000, undefined, 0)],
          mode,
        ),
      );
    }

    const updateEvents = players.map(p => new QueueUpdatedEvent(mode));

    expect(ebus).toEmit(
      ...updateEvents,
      new QueueUpdatedEvent(mode), // clear queue
      new GameFoundEvent(
        mode,
        players.map(
          (p, idx) =>
            new QueueEntryModel(`party${idx}`, mode, [
              new PlayerInQueueEntity(p, 3000, 0.5, 1000, undefined, 0),
            ], 0),
        ),
      ),
    );
  });

  it("Should find 5x5 game with parties", async () => {
    const mode = MatchmakingMode.UNRANKED;

    const parties = [
      // solo
      new EnterQueueCommand(
        `party1_1`,
        [new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0)],
        mode,
      ),
      // solo
      new EnterQueueCommand(
        `party2_1`,
        [new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0)],
        mode,
      ),
      // solo
      new EnterQueueCommand(
        `party4_1`,
        [new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0)],
        mode,
      ),
      // 2x
      new EnterQueueCommand(
        `party5_2`,
        [
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
        ],
        mode,
      ),
      // 3x
      new EnterQueueCommand(
        `party6_3`,
        [
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
        ],
        mode,
      ),
      // 2x
      new EnterQueueCommand(
        `party7_2`,
        [
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
        ],
        mode,
      ),
    ];

    // expect()
    const updateEvents = parties.map(p => new QueueUpdatedEvent(mode));

    for (const party of parties) {
      await cbus.execute(party);
    }

    expect(ebus).toEmit(
      ...updateEvents,
      new QueueUpdatedEvent(mode), // clear queue
      new GameFoundEvent(
        mode,
        parties
          .sort((a, b) => b.players.length - a.players.length)
          .map(t => new QueueEntryModel(t.partyId, mode, t.players, 0)),
      ),
    );
  });

  it("should handle duplicate enter queue", async () => {
    const mode = MatchmakingMode.SOLOMID;
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0)],
        mode,
      ),
    );
    // reset publishes
    ebus.publish = jest.fn();
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0)],
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
        [new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0)],
        MatchmakingMode.RANKED,
      ),
    );

    // enter solomid queue after
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0)],
        MatchmakingMode.SOLOMID,
      ),
    );

    // @ts-ignore
    // console.error(inspect(ebus.publish.mock.calls))
    expect(ebus).toEmit(
      new QueueUpdatedEvent(MatchmakingMode.RANKED), // enter ranked queue
      new QueueUpdatedEvent(MatchmakingMode.RANKED), // leave ranked queue
      new QueueUpdatedEvent(MatchmakingMode.SOLOMID), // enter solomid
    );
  });

  it("should find ranked games in cycle", async () => {
    const mode = MatchmakingMode.RANKED;

    const parties = new Array(20).fill(null).map((_, index) => {
      const players = new Array(Math.round(Math.random() * 2 + 1))
        .fill(null)
        .map(() => {
          return new PlayerInQueueEntity(
            randomUser(),
            (1 - Math.exp(Math.random()) / 2.7) * Math.random() * 4000 + 1000,
            Math.random(),
            Math.random() * 500,
            undefined,
            0,
          );
        });

      return new EnterQueueCommand(
        `party${index}_${players.length}`,
        players,
        mode,
      );
    });

    // expect()
    const updateEvents = parties.map(p => new QueueUpdatedEvent(mode));

    for (const party of parties) {
      await cbus.execute(party);
    }

    const s = module.get(GameCheckCycleHandler);

    await s.handle(new GameCheckCycleEvent(MatchmakingMode.RANKED));

    const expectedFoundGames = Math.floor(
      parties.reduce((a, b) => a + b.size, 0) / 3,
    );

    const expectedUpdates = new Array(expectedFoundGames)
      .fill(null)
      .map(() => new QueueUpdatedEvent(mode));


    const expectedGames = new Array(expectedFoundGames).fill(null).map(
      () =>
        new GameFoundEvent(
          mode,
          parties
            .sort((a, b) => b.players.length - a.players.length)
            .map(t => new QueueEntryModel(t.partyId, mode, t.players, 0)),
        ),
    );
    expect(ebus).toEmit(...updateEvents, ...expectedUpdates, ...expectedGames);
  });
});
