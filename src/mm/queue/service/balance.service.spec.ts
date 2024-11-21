// noinspection JSConstantReassignment

import { Test, TestingModule } from "@nestjs/testing";
import { TestEnvironment } from "@test/cqrs";
import { BalanceService } from "mm/queue/service/balance.service";

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

  it("should result in a low score if no games are played", () => {
    const newbieScore = BalanceService.getScore(2500, 0.5, 0, 0);
    const decentScore = BalanceService.getScore(2500, 0.5, 0, 50);

    expect(decentScore / Math.max(1, newbieScore)).toBeGreaterThan(10);
  });

  it("should make score bigger if winrate is higher", () => {
    const score1 = BalanceService.getScore(3000, 0.5, 0.3, 19);
    const score2 = BalanceService.getScore(3000, 0.8, 0.3, 19);
    expect(score1).toBeLessThan(score2);
  });

  it("should make score bigger if more games played", () => {
    const score1 = BalanceService.getScore(3000, 0.5, 0.3, 19);
    const score2 = BalanceService.getScore(3000, 0.5, 0.3, 25);
    expect(score1).toBeLessThan(score2);
  });
});
