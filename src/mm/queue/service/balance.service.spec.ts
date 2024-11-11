import { Test, TestingModule } from "@nestjs/testing";
import { TestEnvironment } from "@test/cqrs";
import { BalanceService } from "mm/queue/service/balance.service";
import { randomUser } from "@test/values";
import { BalanceException } from "mm/queue/exception/BalanceException";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { BanStatus } from "../../../gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import { Dota2Version } from "../../../gateway/gateway/shared-types/dota2version";

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

  it("should result in 0 score if no games are played", () => {
    expect(BalanceService.getScore(3000, 0, 0, 0)).toEqual(0);
  });

  it("should make score bigger if winrate is higher", () => {
    const score1 = BalanceService.getScore(3000, 0.5, 0.3, 19)
    const score2 = BalanceService.getScore(3000, 0.8, 0.3, 19)
    expect(score1).toBeLessThan(score2);
  });

  it("should make score bigger if more games played", () => {
    const score1 = BalanceService.getScore(3000, 0.5, 0.3, 19)
    const score2 = BalanceService.getScore(3000, 0.5, 0.3, 25)
    expect(score1).toBeLessThan(score2);
  });

  it("should look realistic", () => {
    const superNewbie = BalanceService.getScore(2500, 0, 0, 0);
    const newbie = BalanceService.getScore(2500, 0.3, 0, 3);
    const avg = BalanceService.getScore(2500, 0.45, 20, 50);
    const sweaty = BalanceService.getScore(3000, 0.52, 20, 150);


    expect(superNewbie).toBeLessThan(newbie)
    expect(newbie).toBeLessThan(avg)
    expect(avg).toBeLessThan(sweaty)

    expect(superNewbie * 1.5).toBeLessThan(newbie)
    expect(newbie * 1.5).toBeLessThan(avg)
    expect(avg * 1.5).toBeLessThan(sweaty)
  });


  it("should able to balance an OK game", () => {
    const p = new Array(10).fill(null).map((t, index) => {
      return new QueueEntryModel(
        "id" + index,
        MatchmakingMode.RANKED,
        Dota2Version.Dota_684,
        [
          new PlayerInQueueEntity(
            randomUser(),
            200
          ),
        ],
        43443,
      );
    });
    expect(() => {
      const res = BalanceService.rankedBalance(5, p);
    }).not.toThrow(BalanceException);
  });

  it("should not be able to balance bad game(high score difference)", () => {
    const p: QueueEntryModel[] = [
      new QueueEntryModel(
        "big mmr party",
        MatchmakingMode.RANKED,
        Dota2Version.Dota_684,
        [
          new PlayerInQueueEntity(
            randomUser(),
            500
          ),
          new PlayerInQueueEntity(
            randomUser(),
            300
          ),
        ]
      ),
      ...new Array(8)
        .fill(null)
        .map(
          (t, index) =>
            new QueueEntryModel(
              "id" + index,
              MatchmakingMode.RANKED,
              Dota2Version.Dota_684,
              [
                new PlayerInQueueEntity(
                  randomUser(),
                  100
                ),
              ]
            ),
        ),
    ];

    expect(() => BalanceService.rankedBalance(5, p, true)).toThrow(BalanceException);
  });
});
