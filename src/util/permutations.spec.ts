import { construct } from "../gateway/gateway/util/construct";
import { QueueEntryModel } from "../mm/queue/model/queue-entry.model";
import { findBestMatchBy, findMatch, subsetSum } from "./permutations";
import { distinct } from "./distinct";
import { MatchmakingMode } from "../gateway/gateway/shared-types/matchmaking-mode";
import { Dota2Version } from "../gateway/gateway/shared-types/dota2version";
import { PlayerInQueueEntity } from "../mm/queue/model/entity/player-in-queue.entity";
import { PlayerId } from "../gateway/gateway/shared-types/player-id";
import * as seedrandom from "seedrandom";
import { performance } from "perf_hooks";

function isViableTeam(t: QueueEntryModel[]) {
  return t.reduce((a, b) => a + b.size, 0) == 5;
}

type TeamSetup = [QueueEntryModel[], QueueEntryModel[]];

function teamSetupIdentity(q: TeamSetup) {
  const i1 = q[0]
    .map((t) => t.partyID)
    .sort()
    .join("");
  const i2 = q[1]
    .map((t) => t.partyID)
    .sort()
    .join("");
  return i1 + i2;
}

function createTestPool(partyCount: number, seed = Math.random().toString()) {
  const rng = seedrandom(seed);

  const pool: QueueEntryModel[] = [];
  for (let i = 0; i < partyCount; i++) {
    const partySize = Math.ceil(rng() * 3);
    pool.push(
      new QueueEntryModel(
        `party${i}`,
        MatchmakingMode.UNRANKED,
        Dota2Version.Dota_684,
        Array.from({ length: partySize }).map((_, idx) => {
          return new PlayerInQueueEntity(
            new PlayerId((i * 10000 + idx).toString()),
            rng() * 10000 + 100,
          );
        }),
      ),
    );
  }
  return pool;
}

describe("efficient permutations", () => {
  it("should generate distinct combinations on real data", () => {
    const pool: QueueEntryModel[] = [
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

    const pairs = Array.from(subsetSum(pool, 5));

    const raw = pairs.map((pair) =>
      pair
        .map((it) => it.partyID)
        .sort()
        .join(","),
    );
    expect(raw).toHaveLength(distinct(raw).length);
  });

  it("should generate distinct combinations on real data with lots of entries", () => {
    const pool = createTestPool(25, "loremipsum");

    const pairs = Array.from(subsetSum(pool, 5));

    const raw = pairs.map((pair) =>
      pair
        .map((it) => it.partyID)
        .sort()
        .join(","),
    );
    expect(raw).toHaveLength(distinct(raw).length);
  });

  it("should find match 5x5", () => {
    const pool: QueueEntryModel[] = [
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

    let i = 0;

    const res = findMatch(pool, 5, (left, right) => {
      const scoreLeft = left.reduce((a, b) => a + b.score, 0) / 5;
      const scoreRight = right.reduce((a, b) => a + b.score, 0) / 5;
      const avgDiff = Math.abs(scoreLeft - scoreRight);
      i++;
      return avgDiff < 600;
    });

    expect(res).toBeDefined();
  });

  const diff = (left: QueueEntryModel[], right: QueueEntryModel[]) => {
    const lavg = left.reduce((a, b) => a + b.score, 0) / 5;
    const ravg = right.reduce((a, b) => a + b.score, 0) / 5;
    return Math.abs(lavg - ravg);
  };

  it("should always find a match 5x5 after all", () => {
    const pool: QueueEntryModel[] = createTestPool(100, "seed2");

    expect(pool).toHaveLength(100);
    let i = 0;

    const res = findMatch(pool, 5, (left, right) => {
      console.assert(
        left.reduce((a, b) => a + b.size, 0) === 5,
        "Left team is not of size 5!",
      );
      console.assert(
        right.reduce((a, b) => a + b.size, 0) === 5,
        "Right team is not of size 5!",
      );
      const avgDiff = diff(left, right);
      i++;
      return avgDiff < 0.001;
    });

    expect(res).toBeDefined();
  });

  it("should respect time limit", () => {
    const pool: QueueEntryModel[] = createTestPool(100, "seed2");

    expect(pool).toHaveLength(100);

    let start = performance.now()
    const res = findBestMatchBy(pool, 5, diff, 1000, undefined);

    expect(performance.now() - start).toBeLessThan(1100) // Some room for error
    expect(res).toBeDefined();
  });
});
