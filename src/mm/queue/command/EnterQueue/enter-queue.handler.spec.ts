import {Test, TestingModule} from "@nestjs/testing";
import {CommandBus, EventBus} from "@nestjs/cqrs";
import {clearRepositories, TestEnvironment} from "@test/cqrs";
import {EnterQueueHandler} from "mm/queue/command/EnterQueue/enter-queue.handler";
import {EnterQueueCommand} from "mm/queue/command/EnterQueue/enter-queue.command";
import {MatchmakingMode} from "gateway/gateway/shared-types/matchmaking-mode";
import {QueueUpdatedEvent} from "gateway/gateway/events/queue-updated.event";
import {QueueProviders} from "mm/queue";
import {QueueRepository} from "mm/queue/repository/queue.repository";
import {QueueModel} from "mm/queue/model/queue.model";
import {PlayerInQueueEntity} from "mm/queue/model/entity/player-in-queue.entity";
import {GameFoundEvent} from "mm/queue/event/game-found.event";
import {randomUser} from "@test/values";
import {GameCheckCycleEvent} from "mm/queue/event/game-check-cycle.event";
import {GameCheckCycleHandler} from "mm/queue/event-handler/game-check-cycle.handler";
import {QueueEntryModel} from "mm/queue/model/queue-entry.model";
import {Dota2Version} from "../../../../gateway/gateway/shared-types/dota2version";
import {BanStatus} from "../../../../gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import {RoomBalance, TeamEntry} from "../../../room/model/entity/room-balance";

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
        Dota2Version.Dota_684,
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
          new PlayerInQueueEntity(u1, 1000, BanStatus.NOT_BANNED),
          new PlayerInQueueEntity(u2, 1000, BanStatus.NOT_BANNED),
        ],
        mode,
        Dota2Version.Dota_684
      ),
    );

    expect(ebus).toEmit(
      new QueueUpdatedEvent(mode,Dota2Version.Dota_684, ), // add first
      new QueueUpdatedEvent(mode,Dota2Version.Dota_684, ), // clear
      new GameFoundEvent(new RoomBalance([new TeamEntry([
        new QueueEntryModel(
          "party",
          mode,
          [
            new PlayerInQueueEntity(u1, 1000, BanStatus.NOT_BANNED),
            new PlayerInQueueEntity(u2, 1000, BanStatus.NOT_BANNED),
          ],
          0,
          Dota2Version.Dota_684,
        ),
      ])],mode), Dota2Version.Dota_684),
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
        Dota2Version.Dota_684,
      ),
      // solo
      new EnterQueueCommand(
        `party2_1`,
        [new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0)],
        mode,
        Dota2Version.Dota_684,
      ),
      // solo
      new EnterQueueCommand(
        `party4_1`,
        [new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0)],
        mode,
        Dota2Version.Dota_684,
      )
      // 2x
      new EnterQueueCommand(
        `party5_2`,
        [
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
        ],
        mode,
        Dota2Version.Dota_684,
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
        Dota2Version.Dota_684,
      ),
      // 2x
      new EnterQueueCommand(
        `party7_2`,
        [
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
          new PlayerInQueueEntity(randomUser(), 3000, 0.5, 1000, undefined, 0),
        ],
        mode,
        Dota2Version.Dota_684,
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
        Dota2Version.Dota_684,
      ),
    );
    // reset publishes
    ebus.publish = jest.fn();
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0)],
        mode,
        Dota2Version.Dota_684,
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
        Dota2Version.Dota_684,
      ),
    );

    // enter solomid queue after
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 1000, 0.5, 100, undefined, 0)],
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
      ),
    );

    // @ts-ignore
    // console.error(inspect(ebus.publish.mock.calls))
    expect(ebus).toEmit(
      new QueueUpdatedEvent(MatchmakingMode.RANKED, Dota2Version.Dota_684), // enter ranked queue
      new QueueUpdatedEvent(MatchmakingMode.RANKED, Dota2Version.Dota_684), // leave ranked queue
      new QueueUpdatedEvent(MatchmakingMode.SOLOMID, Dota2Version.Dota_684), // enter solomid
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

    await s.handle(
      new GameCheckCycleEvent(MatchmakingMode.RANKED, Dota2Version.Dota_684),
    );

    const expectedFoundGames = Math.floor(
      parties.reduce((a, b) => a + b.size, 0) / 3,
    );

    const expectedUpdates = new Array(expectedFoundGames)
      .fill(null)
      .map(() => new QueueUpdatedEvent(mode, Dota2Version.Dota_684));

    const expectedGames = new Array(expectedFoundGames).fill(null).map(
      () =>
        new GameFoundEvent(
          mode,
          parties
            .sort((a, b) => b.players.length - a.players.length)
            .map(
              t =>
                new QueueEntryModel(
                  t.partyId,
                  mode,
                  t.players,
                  Dota2Version.Dota_684,
                  0,
                ),
            ),
        ),
    );
    expect(ebus).toEmit(...updateEvents, ...expectedUpdates, ...expectedGames);
  });
});
