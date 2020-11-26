import {Test, TestingModule} from "@nestjs/testing";
import {TestEnvironment} from "src/@test/cqrs";
import {BalanceService} from "src/mm/queue/service/balance.service";
import {PartyInRoom} from "src/mm/room/command/CreateRoom/create-room.command";
import {PlayerInPartyInRoom} from "src/mm/room/model/room-entry";
import {randomUser} from "src/@test/values";
import {BalanceException} from "src/mm/queue/exception/BalanceException";

describe("", () => {
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
      service.getScore({
        mmr: 3000,
        gamesPlayed: 0,
        wrLast20Games: 0,
      }),
    ).toEqual(3000);
  });

  it("should result in score lower than mmr if winrate is lower than desired", () => {
    expect(
      service.getScore({
        mmr: 3000,
        gamesPlayed: 15,
        wrLast20Games: 0.3,
      }),
    ).toBeLessThan(3000);
  });

  it("should result in score higher than mmr if winrate is higher than desired", () => {
    expect(
      service.getScore({
        mmr: 3000,
        gamesPlayed: 15,
        wrLast20Games: 0.8,
      }),
    ).toBeGreaterThan(3000);
  });

  it("should not have abs score and mmr diff more than 1000", () => {
    const score = service.getScore({
      mmr: 3000,
      gamesPlayed: 20,
      wrLast20Games: 1,
    });
    expect(score).toBeGreaterThanOrEqual(3000);
    expect(score).toBeLessThanOrEqual(4000);
  });

  it("should party score", () => {
    const score = service.getPartyScore({
      players: [
        {
          mmr: 3000,
          gamesPlayed: 20,
          wrLast20Games: 1,
        },
        {
          mmr: 3000,
          gamesPlayed: 20,
          wrLast20Games: 0.25,
        },
      ],
      partyId: "tmp",
    });
    expect(score.totalScore).toBeGreaterThanOrEqual(6000);
  });

  it("should able to balance an OK game", () => {
    const p = new Array(10).fill(null).map((t, index) => {
      return new PartyInRoom("id" + index, [
        new PlayerInPartyInRoom(randomUser(), 1000, 0.5, 1000),
      ]);
    });
    expect(() => service.rankedBalance(5, p)).not.toThrow(BalanceException)
  });
});
