import { Test, TestingModule } from "@nestjs/testing";
import { TestEnvironment } from "src/@test/cqrs";
import { BalanceService } from "src/mm/queue/service/balance.service";
import { PartyInRoom } from "src/mm/room/command/CreateRoom/create-room.command";
import { randomUser } from "src/@test/values";
import { BalanceException } from "src/mm/queue/exception/BalanceException";
import { inspect } from "util";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";
import {MatchmakingMode} from "src/gateway/gateway/shared-types/matchmaking-mode";

describe("BalanceService", () => {
  let module: TestingModule;
  let service: BalanceService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        // ...QueueProviders,
        BalanceService,
        ...TestEnvironment(),
      ],
    }).compile();

    service = module.get(BalanceService);
  });

  it("should result in score same as mmr if no games played", () => {
    expect(
      BalanceService.getScore(3000, 0, 0),
    ).toEqual(3000);
  });

  it("should result in score lower than mmr if winrate is lower than desired", () => {
    expect(
      BalanceService.getScore(3000, 15, 0.3),
    ).toBeLessThan(3000);
  });

  it("should result in score higher than mmr if winrate is higher than desired", () => {
    expect(
      BalanceService.getScore(3000, 15, 0.8),
    ).toBeGreaterThan(3000);
  });

  it("should not have abs score and mmr diff more than 1000", () => {
    const score = BalanceService.getScore(3000, 1, 20);
    expect(score).toBeGreaterThanOrEqual(3000);
    expect(score).toBeLessThanOrEqual(4000);
  });

  // it("should party score", () => {
  //   const score = service.getPartyScore({
  //     players: [
  //       {
  //         mmr: 3000,
  //         gamesPlayed: 20,
  //         wrLast20Games: 1,
  //       },
  //       {
  //         mmr: 3000,
  //         gamesPlayed: 20,
  //         wrLast20Games: 0.25,
  //       },
  //     ],
  //     partyId: "tmp",
  //   });
  //   expect(score.totalScore).toBeGreaterThanOrEqual(6000);
  // });

  it("should able to balance an OK game", () => {
    const p = new Array(10).fill(null).map((t, index) => {
      return new QueueEntryModel("id" + index, MatchmakingMode.RANKED, [
        new PlayerInQueueEntity(randomUser(), 1000, 0.5, 1000, undefined, 0),
      ], 43443);
    });
    expect(() => {
      const res = BalanceService.rankedBalance(5, p);
    }).not.toThrow(BalanceException);
  });

  it("should not be able to balance bad game(high score difference)", () => {
    const p: QueueEntryModel[] = [
      new QueueEntryModel("big mmr party", MatchmakingMode.RANKED, [
        new PlayerInQueueEntity(randomUser(), 4500, 0.7, 100, undefined, 0),
        new PlayerInQueueEntity(randomUser(), 3900, 0.6, 100, undefined, 0),
      ], 10000),
      ...new Array(8)
        .fill(null)
        .map(
          (t, index) =>
            new QueueEntryModel("id" + index, MatchmakingMode.RANKED, [
              new PlayerInQueueEntity(
                randomUser(),
                2000 + Math.round(Math.random() * 1000 - 500),
                0.5,
                1000,
                undefined,
                0
              ),
            ], 3434),
        ),
    ];

    expect(() => BalanceService.rankedBalance(5, p)).toThrow(BalanceException);
  });
});
