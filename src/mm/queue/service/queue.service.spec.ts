import { Test, TestingModule } from "@nestjs/testing";
import { TestEnvironment } from "@test/cqrs";
import { QueueProviders } from "mm/queue";
import { QueueService } from "mm/queue/service/queue.service";
import { QueueModel } from "mm/queue/model/queue.model";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { randomUser } from "@test/values";
import { Dota2Version } from "../../../gateway/gateway/shared-types/dota2version";
import { uuid } from "../../../@shared/generateID";
import { PlayerId } from "../../../gateway/gateway/shared-types/player-id";

function withUser(q: QueueModel, ...players: PlayerId[]): PlayerId[] {
  q.addEntry(
    new QueueEntryModel(
      uuid(),
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
      players.map((u1) => new PlayerInQueueEntity(u1, 1000)),
    ),
  );

  return players;
}

describe("QueueService", () => {
  let qs: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    qs = module.get(QueueService);
  });

  type PartySize = 1 | 2 | 3 | 4 | 5;
  type Preset = Partial<Record<PartySize, number>>;

  const presets: Preset[] = [
    { "1": 10 },
    { "1": 8, "2": 1 },
    { "1": 7, "3": 1 },
    { "1": 6, "2": 2 },
    { "1": 5, "2": 1, "3": 1 },
    { "1": 6, "4": 1 },
    { "1": 5, "5": 1 },
    { "1": 8, "2": 1 },
    { "1": 6, "2": 2 },
    { "1": 5, "2": 1, "3": 1 },
    { "1": 4, "2": 3 },
    { "1": 3, "2": 2, "3": 1 },
    { "1": 4, "2": 1, "4": 1 },
    { "1": 3, "2": 1, "5": 1 },
    { "1": 7, "3": 1 },
    { "1": 5, "2": 1, "3": 1 },
    { "1": 4, "3": 2 },
    { "1": 3, "2": 2, "3": 1 },
    { "1": 2, "2": 1, "3": 2 },
    { "1": 3, "3": 1, "4": 1 },
    { "1": 2, "3": 1, "5": 1 },
    { "1": 6, "2": 2 },
    { "1": 4, "2": 3 },
    { "1": 3, "2": 2, "3": 1 },
    { "1": 2, "2": 4 },
    { "1": 1, "2": 3, "3": 1 },
    { "1": 2, "2": 2, "4": 1 },
    { "1": 1, "2": 2, "5": 1 },
    { "1": 5, "2": 1, "3": 1 },
    { "1": 3, "2": 2, "3": 1 },
    { "1": 2, "2": 1, "3": 2 },
    { "1": 1, "2": 3, "3": 1 },
    { "2": 2, "3": 2 },
    { "1": 1, "2": 1, "3": 1, "4": 1 },
    { "2": 1, "3": 1, "5": 1 },
    { "1": 6, "4": 1 },
    { "1": 4, "2": 1, "4": 1 },
    { "1": 3, "3": 1, "4": 1 },
    { "1": 2, "2": 2, "4": 1 },
    { "1": 1, "2": 1, "3": 1, "4": 1 },
    { "1": 2, "4": 2 },
    { "1": 1, "4": 1, "5": 1 },
    { "1": 5, "5": 1 },
    { "1": 3, "2": 1, "5": 1 },
    { "1": 2, "3": 1, "5": 1 },
    { "1": 1, "2": 2, "5": 1 },
    { "2": 1, "3": 1, "5": 1 },
    { "1": 1, "4": 1, "5": 1 },
    { "5": 2 },
  ];
  function makeTest(preset: Preset) {
    for (let i = 0; i < 1000; i++) {
      // Clean
      const qModel = new QueueModel(
        MatchmakingMode.UNRANKED,
        Dota2Version.Dota_684,
      );

      for (let [pSize, count] of Object.entries(preset)) {
        const partySize = parseInt(pSize);
        for (let j = 0; j < count; j++) {
          const players: PlayerInQueueEntity[] = [];
          const qem = new QueueEntryModel(
            uuid(),
            MatchmakingMode.UNRANKED,
            Dota2Version.Dota_684,
            players,
          );

          for (let k = 0; k < partySize; k++) {
            const plr = new PlayerInQueueEntity(
              randomUser(),
              Math.random() * 20000 + 1000,
            );
            players.push(plr);
          }

          qModel.addEntry(qem);
        }
      }

      expect(qModel.size).toEqual(10);

      const foundGame = qs.findBalancedGame(qModel);
      expect(foundGame.teams).toHaveLength(2);

      const leftCount = foundGame.teams[0].parties.reduce(
        (a, b) => a + b.size,
        0,
      );
      const rightCount = foundGame.teams[0].parties.reduce(
        (a, b) => a + b.size,
        0,
      );

      expect(leftCount).toEqual(5);
      expect(rightCount).toEqual(5);

      if (!foundGame) {
        console.error(JSON.stringify(qModel.entries));
        expect(true).toBeFalsy();
      }
    }
  }

  for (let preset of presets) {
    const pattern = Object.entries(preset)
      .map(([key, value]) => `${value}x${key}`)
      .join(", ");

    it(`should match a game with ${pattern}`, () => {
      makeTest(preset);
    });
  }

  const specificPreset = presets[3];

  const pattern = Object.entries(specificPreset)
    .map(([key, value]) => `${value}x${key}`)
    .join(", ");

  it("[HARDCODE] should match " + pattern, () => {
    makeTest(specificPreset);
  });

  it("All presets should sum to 10 players", () => {
    const badPresetIndex = presets.findIndex((preset) => {
      const totalPlayers = Object.entries(preset).reduce(
        (a, [partySize, partyCount]) => a + parseInt(partySize) * partyCount,
        0,
      );
      return totalPlayers !== 10;
    });
    expect(badPresetIndex).toEqual(-1);
  });

  it("should find bots game with 1 person", () => {
    const qModel = new QueueModel(MatchmakingMode.BOTS, Dota2Version.Dota_684);
    const qem = new QueueEntryModel(
      uuid(),
      MatchmakingMode.UNRANKED,
      Dota2Version.Dota_684,
      [new PlayerInQueueEntity(randomUser(), 1000)],
    );

    qModel.addEntry(qem);

    const balance = qs.findBotsGame(qModel);
    expect(balance).toBeDefined();
    expect(balance.teams).toHaveLength(2);
    expect(
      balance.teams[0].parties.length + balance.teams[1].parties.length,
    ).toEqual(1);
  });

  it("should put only one party per game", () => {
    const qModel = new QueueModel(MatchmakingMode.BOTS, Dota2Version.Dota_684);

    qModel.addEntry(
      new QueueEntryModel(
        uuid(),
        MatchmakingMode.UNRANKED,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 1000)],
      ),
    );

    qModel.addEntry(
      new QueueEntryModel(
        uuid(),
        MatchmakingMode.UNRANKED,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 1000)],
      ),
    );

    const balance = qs.findBotsGame(qModel);
    expect(balance).toBeDefined();
    expect(balance.teams).toHaveLength(2);
    expect(
      balance.teams[0].parties.length + balance.teams[1].parties.length,
    ).toEqual(1);

    expect(balance.teams[0].parties).toHaveLength(1);
    expect(balance.teams[1].parties).toHaveLength(0);
  });

  it("should handle parties and put them together", () => {
    const qModel = new QueueModel(MatchmakingMode.BOTS, Dota2Version.Dota_684);

    qModel.addEntry(
      new QueueEntryModel(
        uuid(),
        MatchmakingMode.UNRANKED,
        Dota2Version.Dota_684,
        [
          new PlayerInQueueEntity(randomUser(), 1000),
          new PlayerInQueueEntity(randomUser(), 1000),
        ],
      ),
    );

    const balance = qs.findBotsGame(qModel);
    expect(balance).toBeDefined();
    expect(balance.teams).toHaveLength(2);
    expect(
      balance.teams[0].parties.length + balance.teams[1].parties.length,
    ).toEqual(1);

    expect(balance.teams[0].parties).toHaveLength(1);

    expect(balance.teams[1].parties).toHaveLength(0);
  });

  it("should not find 1x1 game if there are not enough players", () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );

    const u1 = randomUser();
    qModel.addEntry(
      new QueueEntryModel(
        uuid(),
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(u1, 1000)],
      ),
    );

    const balance = qs.findSolomidGame(qModel);
    expect(balance).toBeUndefined();
  });

  it("should match 1x1 game with party of 2 players", () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );

    const u1 = randomUser();
    const u2 = randomUser();
    qModel.addEntry(
      new QueueEntryModel(
        uuid(),
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(u1, 1000), new PlayerInQueueEntity(u2, 1000)],
      ),
    );

    const balance = qs.findSolomidGame(qModel);
    expect(balance).toBeDefined();

    expect(balance.teams[0].parties).toHaveLength(1);
    expect(balance.teams[1].parties).toHaveLength(1);

    expect(balance.teams[0].parties[0].players[0].playerId.value).toEqual(
      u1.value,
    );

    expect(balance.teams[1].parties[0].players[0].playerId.value).toEqual(
      u2.value,
    );
  });

  it("should match 1x1 game with single players", () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );

    const u1 = randomUser();
    const u2 = randomUser();
    qModel.addEntry(
      new QueueEntryModel(
        uuid(),
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(u1, 1000)],
      ),
    );
    qModel.addEntry(
      new QueueEntryModel(
        uuid(),
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(u2, 1000)],
      ),
    );

    const balance = qs.findSolomidGame(qModel);
    expect(balance).toBeDefined();

    expect(balance.teams[0].parties).toHaveLength(1);
    expect(balance.teams[1].parties).toHaveLength(1);

    expect(balance.teams[0].parties[0].players[0].playerId.value).toEqual(
      u1.value,
    );

    expect(balance.teams[1].parties[0].players[0].playerId.value).toEqual(
      u2.value,
    );
  });

  it("should find 2x2 bots game with 4 singles", () => {
    const qModel = new QueueModel(
      MatchmakingMode.BOTS_2X2,
      Dota2Version.Dota_684,
    );

    const users = Array.from({ length: 5 }, randomUser);
    users.forEach((u) => withUser(qModel, u));

    const balance = qs.findBalancedGame(qModel, 2);
    expect(balance).toBeDefined();

    expect(balance.teams[0].parties).toHaveLength(2);
    expect(balance.teams[0].parties).toHaveLength(2);
  });

  it("should find 2x2 bots game with party of 2 and singles", () => {
    const qModel = new QueueModel(
      MatchmakingMode.BOTS_2X2,
      Dota2Version.Dota_684,
    );

    const users = [
      ...withUser(qModel, randomUser(), randomUser()),
      Array.from({ length: 3 }, randomUser).map((u) => withUser(qModel, u)),
    ];

    const balance = qs.findBalancedGame(qModel, 2);
    expect(balance).toBeDefined();

    // Party of 2 should be in game, as well as 2 singles
    expect(
      [balance.teams[0].parties.length, balance.teams[1].parties.length].sort(),
    ).toEqual([1, 2]);
  });

  it("should not find 2x2 bots game when parties are big", () => {
    const qModel = new QueueModel(
      MatchmakingMode.BOTS_2X2,
      Dota2Version.Dota_684,
    );

    const users = [
      ...withUser(qModel, randomUser(), randomUser(), randomUser()),
      ...withUser(qModel, randomUser(), randomUser()),
      ...withUser(
        qModel,
        randomUser(),
        randomUser(),
        randomUser(),
        randomUser(),
        randomUser(),
      ),
      ...withUser(qModel, randomUser()),
    ];

    const balance = qs.findBalancedGame(qModel, 2);
    expect(balance).toBeUndefined();
  });
});
