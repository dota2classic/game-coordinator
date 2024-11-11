import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { EnterQueueHandler } from "mm/queue/command/EnterQueue/enter-queue.handler";
import { EnterQueueCommand } from "mm/queue/command/EnterQueue/enter-queue.command";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueUpdatedEvent } from "gateway/gateway/events/queue-updated.event";
import { QueueProviders } from "mm/queue";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueModel } from "mm/queue/model/queue.model";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import { randomUser } from "@test/values";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { GameCheckCycleHandler } from "mm/queue/event-handler/game-check-cycle.handler";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { Dota2Version } from "../../../../gateway/gateway/shared-types/dota2version";
import { BanStatus } from "../../../../gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import {
  RoomBalance,
  TeamEntry,
} from "../../../room/model/entity/room-balance";
import { BalanceService } from "../../service/balance.service";

const u1 = randomUser();
const u2 = randomUser();
describe("EnterQueueHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;

  let module: TestingModule;

  const createTestQ = async (mode: MatchmakingMode) => {
    const rep = module.get<QueueRepository>(QueueRepository);
    const q = new QueueModel(mode, Dota2Version.Dota_684);
    return rep.save(q.compId, q);
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get(CommandBus);
    ebus = module.get(EventBus);
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
        [new PlayerInQueueEntity(u1, 100)],
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
        [new PlayerInQueueEntity(u1, 100)],
        mode,
        Dota2Version.Dota_684,
      ),
    );
    expect(ebus).toEmit(new QueueUpdatedEvent(mode, Dota2Version.Dota_684));
  });

  it("Should find game", async () => {
    const mode = MatchmakingMode.SOLOMID;
    const version = Dota2Version.Dota_684

    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [
          new PlayerInQueueEntity(u1, 1000, BanStatus.NOT_BANNED),
          new PlayerInQueueEntity(u2, 1000, BanStatus.NOT_BANNED),
        ],
        mode,
        version,
      ),
    );

    expect(ebus).toEmit(
      new QueueUpdatedEvent(mode, version), // add first
      new QueueUpdatedEvent(mode, version), // clear
      new GameFoundEvent(
        new RoomBalance([
          new TeamEntry([
            new QueueEntryModel(
              "party",
              mode,
              version,
              [
                new PlayerInQueueEntity(u1, 1000, BanStatus.NOT_BANNED),
                new PlayerInQueueEntity(u2, 1000, BanStatus.NOT_BANNED),
              ],
              0,
            ),
          ]),
        ]),
        version,
        mode,
      ),
    );
  });

  it("Should find 5x5 game with parties", async () => {
    const mode = MatchmakingMode.UNRANKED;
    const version = Dota2Version.Dota_684;

    const parties = [
      // solo
      new EnterQueueCommand(
        `party1_1`,
        [new PlayerInQueueEntity(randomUser(), 100)],
        mode,
        Dota2Version.Dota_684,
      ),
      // solo
      new EnterQueueCommand(
        `party2_1`,
        [new PlayerInQueueEntity(randomUser(), 100)],
        mode,
        Dota2Version.Dota_684,
      ),
      // solo
      new EnterQueueCommand(
        `party4_1`,
        [new PlayerInQueueEntity(randomUser(), 100)],
        mode,
        Dota2Version.Dota_684,
      ),
      // 2x
      new EnterQueueCommand(
        `party5_2`,
        [
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
        ],
        mode,
        Dota2Version.Dota_684,
      ),
      // 3x
      new EnterQueueCommand(
        `party6_3`,
        [
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
        ],
        mode,
        Dota2Version.Dota_684,
      ),
      // 2x
      new EnterQueueCommand(
        `party7_2`,
        [
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
        ],
        mode,
        Dota2Version.Dota_684,
      ),
    ];

    // expect()
    const updateEvents = parties.map(p => new QueueUpdatedEvent(mode, version));

    for (const party of parties) {
      await cbus.execute(party);
    }

    expect(ebus).toEmit(
      ...updateEvents,
      new QueueUpdatedEvent(mode, version), // clear queue
      new GameFoundEvent(
        BalanceService.rankedBalance(
          5,
          parties
            .sort((a, b) => b.players.length - a.players.length)
            .map(
              t => new QueueEntryModel(t.partyId, mode, version, t.players, 0),
            ),
          false,
        ),

        version,
        mode,
      ),
    );
  });

  it("should handle duplicate enter queue", async () => {
    const mode = MatchmakingMode.SOLOMID;
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
        mode,
        Dota2Version.Dota_684,
      ),
    );
    // reset publishes
    ebus.publish = jest.fn();
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
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
        [new PlayerInQueueEntity(u1, 100)],
        MatchmakingMode.RANKED,
        Dota2Version.Dota_684,
      ),
    );

    // enter solomid queue after
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
      ),
    );

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
            Math.random() * 500,
            undefined
          );
        });

      return new EnterQueueCommand(
        `party${index}_${players.length}`,
        players,
        mode,
        Dota2Version.Dota_684
      );
    });

    // expect()
    const updateEvents = parties.map(p => new QueueUpdatedEvent(mode, Dota2Version.Dota_684));

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
          BalanceService.rankedBalance(
            5,
            parties
              .sort((a, b) => b.players.length - a.players.length)
              .map(
                t =>
                  new QueueEntryModel(
                    t.partyId,
                    mode,
                    Dota2Version.Dota_684,
                    t.players,
                    0,
                  ),
              )
          ),
          Dota2Version.Dota_684,
          mode,
        ),
    );
    expect(ebus).toEmit(...updateEvents, ...expectedUpdates, ...expectedGames);
  });
});
