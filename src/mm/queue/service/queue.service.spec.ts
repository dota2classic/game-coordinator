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
import { combinations2, permute } from "../../../util/permutations";
import { BalanceService } from "./balance.service";
import { construct } from "../../../gateway/gateway/util/construct";

describe("QueueService", () => {
  let qs: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    qs = module.get(QueueService);
  });

  it("should not find unranked game where not enough players", async () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );
    expect(qs.findGame(qModel)).toBeUndefined();
    qModel.addEntry(
      new QueueEntryModel(
        "1",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 100)],
        0,
      ),
    );
    expect(qs.findGame(qModel)).toBeUndefined();
  });

  it("should find unranked game where there are only singles", async () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );
    qModel.addEntry(
      new QueueEntryModel(
        "1",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 100)],
        0,
      ),
    );
    qModel.addEntry(
      new QueueEntryModel(
        "2",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 100)],
        0,
      ),
    );
    expect(qs.findGame(qModel)).toBeDefined();
  });

  it("should find unranked game where there is party", async () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );
    qModel.addEntry(
      new QueueEntryModel(
        "1",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
        ],
        0,
      ),
    );
    expect(qs.findGame(qModel)).toBeDefined();
  });

  it("should not find unranked game when party size > room size", async () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );
    qModel.addEntry(
      new QueueEntryModel(
        "1",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
        ],
        0,
      ),
    );
    expect(qs.findGame(qModel)).toBeUndefined();
  });

  type PartySize = 1 | 2 | 3 | 4 | 5;
  type Preset = Partial<Record<PartySize, number>>;

  const presets: Preset[] = [
    { "1": 10 },
    { "1": 8, "2": 1 },
    { "1": 7, "3": 1 },
    { "1": 6, "2": 1, "3": 1 },
    { "1": 6, "2": 2 },
    { "1": 5, "2": 1, "3": 1 },
    { "1": 6, "2": 1, "3": 1 },
    { "1": 6, "4": 1 },
    { "1": 5, "5": 1 },
    { "1": 8, "2": 1 },
    { "1": 6, "2": 2 },
    { "1": 5, "2": 1, "3": 1 },
    { "1": 4, "2": 2, "3": 1 },
    { "1": 4, "2": 3 },
    { "1": 3, "2": 2, "3": 1 },
    { "1": 4, "2": 2, "3": 1 },
    { "1": 4, "2": 1, "4": 1 },
    { "1": 3, "2": 1, "5": 1 },
    { "1": 7, "3": 1 },
    { "1": 5, "2": 1, "3": 1 },
    { "1": 4, "3": 2 },
    { "1": 3, "2": 1, "3": 2 },
    { "1": 3, "2": 2, "3": 1 },
    { "1": 2, "2": 1, "3": 2 },
    { "1": 3, "2": 1, "3": 2 },
    { "1": 3, "3": 1, "4": 1 },
    { "1": 2, "3": 1, "5": 1 },
    { "1": 6, "2": 1, "3": 1 },
    { "1": 4, "2": 2, "3": 1 },
    { "1": 3, "2": 1, "3": 2 },
    { "1": 2, "2": 2, "3": 2 },
    { "1": 2, "2": 3, "3": 1 },
    { "1": 1, "2": 2, "3": 2 },
    { "1": 2, "2": 2, "3": 2 },
    { "1": 2, "2": 1, "3": 1, "4": 1 },
    { "1": 1, "2": 1, "3": 1, "5": 1 },
    { "1": 6, "2": 2 },
    { "1": 4, "2": 3 },
    { "1": 3, "2": 2, "3": 1 },
    { "1": 2, "2": 3, "3": 1 },
    { "1": 2, "2": 4 },
    { "1": 1, "2": 3, "3": 1 },
    { "1": 2, "2": 3, "3": 1 },
    { "1": 2, "2": 2, "4": 1 },
    { "1": 1, "2": 2, "5": 1 },
    { "1": 5, "2": 1, "3": 1 },
    { "1": 3, "2": 2, "3": 1 },
    { "1": 2, "2": 1, "3": 2 },
    { "1": 1, "2": 2, "3": 2 },
    { "1": 1, "2": 3, "3": 1 },
    { "2": 2, "3": 2 },
    { "1": 1, "2": 2, "3": 2 },
    { "1": 1, "2": 1, "3": 1, "4": 1 },
    { "2": 1, "3": 1, "5": 1 },
    { "1": 6, "2": 1, "3": 1 },
    { "1": 4, "2": 2, "3": 1 },
    { "1": 3, "2": 1, "3": 2 },
    { "1": 2, "2": 2, "3": 2 },
    { "1": 2, "2": 3, "3": 1 },
    { "1": 1, "2": 2, "3": 2 },
    { "1": 2, "2": 2, "3": 2 },
    { "1": 2, "2": 1, "3": 1, "4": 1 },
    { "1": 1, "2": 1, "3": 1, "5": 1 },
    { "1": 6, "4": 1 },
    { "1": 4, "2": 1, "4": 1 },
    { "1": 3, "3": 1, "4": 1 },
    { "1": 2, "2": 1, "3": 1, "4": 1 },
    { "1": 2, "2": 2, "4": 1 },
    { "1": 1, "2": 1, "3": 1, "4": 1 },
    { "1": 2, "2": 1, "3": 1, "4": 1 },
    { "1": 2, "4": 2 },
    { "1": 1, "4": 1, "5": 1 },
    { "1": 5, "5": 1 },
    { "1": 3, "2": 1, "5": 1 },
    { "1": 2, "3": 1, "5": 1 },
    { "1": 1, "2": 1, "3": 1, "5": 1 },
    { "1": 1, "2": 2, "5": 1 },
    { "2": 1, "3": 1, "5": 1 },
    { "1": 1, "2": 1, "3": 1, "5": 1 },
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

      const foundGame = qs.balancedGame(qModel);
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

  const pattern = Object.entries(presets[1])
    .map(([key, value]) => `${value}x${key}`)
    .join(", ");
  it("should match 8x1, 1x2" + pattern, () => {
    makeTest(presets[1]);
  });

  function balanceExample(any: any[]) {
    console.log(any);
    console.log(
      any
        .map((it) => `[${it.players.map((it) => it.value).join(", ")}]`)
        .join("\nVS\n"),
    );
  }

  it("should tmp", () => {
    const arr: any[] = [
      {
        partyID: "ac24606c-0fd5-4ddf-9c2a-3e5df648ea42",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "379848" }, balanceScore: 13953.755340683225 },
        ],
        waitingScore: 0,
      },
      {
        partyID: "dc952517-20ea-4502-86c4-c98671cc4118",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "346737" }, balanceScore: 13602.84033014166 },
        ],
        waitingScore: 0,
      },
      {
        partyID: "5657050b-f4ce-4dd3-b25b-ef1f532c9657",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "187873" }, balanceScore: 14167.503418066237 },
        ],
        waitingScore: 0,
      },
      {
        partyID: "2d986ea3-cb3e-4b5e-93bb-c8d12f970c71",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "872950" }, balanceScore: 11330.960637025557 },
        ],
        waitingScore: 0,
      },
      {
        partyID: "3b1384fe-2d08-4542-97b4-46e01f0d410c",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "419958" }, balanceScore: 13429.665184169582 },
        ],
        waitingScore: 0,
      },
      {
        partyID: "6ffcece6-b7bb-435c-bfd8-4eb490693e13",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "635421" }, balanceScore: 10756.196153554729 },
        ],
        waitingScore: 0,
      },
      {
        partyID: "a06300ca-1877-4a60-adc4-b380d9d55f4b",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "273913" }, balanceScore: 20509.319693535097 },
        ],
        waitingScore: 0,
      },
      {
        partyID: "f7d5cc0a-107b-4db8-8d90-b52b81abd47f",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "913604" }, balanceScore: 8564.624403971131 },
        ],
        waitingScore: 0,
      },
      {
        partyID: "b123f658-045a-471a-9c45-ed7d89914447",
        mode: 1,
        version: "Dota_684",
        players: [
          { playerId: { value: "276909" }, balanceScore: 4077.2614602680105 },
          { playerId: { value: "881633" }, balanceScore: 2103.6915420063665 },
        ],
        waitingScore: 0,
      },
    ].map((t) => construct(QueueEntryModel, t as any));

    let some: QueueEntryModel[][] = Array.from(combinations2(arr, arr.length));
    for (let pool of some) {
      const permutations: QueueEntryModel[][] = permute(pool);

      const balances = permutations
        .map((permutation) => {
          try {
            return BalanceService.fillBalance(5, permutation);
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      console.log(`${balances.length} / ${permutations.length}`);
    }

    // const balance = BalanceService.rankedBalance(5, some[0], false)
    // console.log(some.length);
    // console.log(balance);

    // const combos = findAllMatchingCombinations(5, cparr, t => true, x => x.players.length)
    // balanceExample(combos)
    // console.log(JSON.stringify(combos, null, 2))
    // iterateCombinations(arr, 10, combo => {
    //   arr2.push(combo)
    //   return true;
    // }, t => t.players.length)
    // console.log(arr2)
  });
});
