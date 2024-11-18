// noinspection JSConstantReassignment

import { Test, TestingModule } from "@nestjs/testing";
import { TestEnvironment } from "@test/cqrs";
import { BalanceService } from "mm/queue/service/balance.service";
import { randomUser } from "@test/values";
import { BalanceException } from "mm/queue/exception/BalanceException";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { Dota2Version } from "../../../gateway/gateway/shared-types/dota2version";
import { findAllMatchingCombinations } from "../../../util/combinations";

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

  it("should look realistic", () => {
    const superNewbie = BalanceService.getScore(2500, 0, 0, 0);
    const newbie = BalanceService.getScore(2500, 0.3, 0, 3);
    const avg = BalanceService.getScore(2500, 0.45, 20, 50);
    const sweaty = BalanceService.getScore(3000, 0.52, 20, 150);

    expect(superNewbie).toBeLessThan(newbie);
    expect(newbie).toBeLessThan(avg);
    expect(avg).toBeLessThan(sweaty);

    expect(superNewbie * 1.5).toBeLessThan(newbie);
    expect(newbie * 1.5).toBeLessThan(avg);
    expect(avg * 1.5).toBeLessThan(sweaty);
  });

  it("should able to balance an OK game", () => {
    const p = new Array(10).fill(null).map((t, index) => {
      return new QueueEntryModel(
        "id" + index,
        MatchmakingMode.RANKED,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 200)],
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
          new PlayerInQueueEntity(randomUser(), 500),
          new PlayerInQueueEntity(randomUser(), 300),
        ],
      ),
      ...new Array(8)
        .fill(null)
        .map(
          (t, index) =>
            new QueueEntryModel(
              "id" + index,
              MatchmakingMode.RANKED,
              Dota2Version.Dota_684,
              [new PlayerInQueueEntity(randomUser(), 100)],
            ),
        ),
    ];

    expect(() => BalanceService.rankedBalance(5, p, true)).toThrow(
      BalanceException,
    );
  });

  // it("should resolve real world examples", () => {
  //   const stuff = [
  //       {
  //         "playerId": {
  //           "value": "1177028171"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 4446,
  //         "recentWinrate": 0.7,
  //         "recentKDA": 9.85,
  //         "gamesPlayed": 521,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 1731354700057,
  //           "status": 0
  //         },
  //         "name": "RX"
  //       },
  //       {
  //         "playerId": {
  //           "value": "153961832"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 4309,
  //         "recentWinrate": 0.85,
  //         "recentKDA": 11.4,
  //         "gamesPlayed": 195,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Very Nice"
  //       },
  //       {
  //         "playerId": {
  //           "value": "59565811"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3818,
  //         "recentWinrate": 0.8,
  //         "recentKDA": 9.8,
  //         "gamesPlayed": 551,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "трансминьон"
  //       },
  //       {
  //         "playerId": {
  //           "value": "173614974"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3766,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 8.9,
  //         "gamesPlayed": 370,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "a b s o l u t"
  //       },
  //       {
  //         "playerId": {
  //           "value": "175751439"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3764,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 6.45,
  //         "gamesPlayed": 313,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "шаражная калека"
  //       },
  //       {
  //         "playerId": {
  //           "value": "473105418"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3712,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 4.95,
  //         "gamesPlayed": 173,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "アリス"
  //       },
  //       {
  //         "playerId": {
  //           "value": "172030769"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3605,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 6.85,
  //         "gamesPlayed": 1571,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Fate"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1183203219"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3427,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 5.85,
  //         "gamesPlayed": 128,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "El Capone"
  //       },
  //       {
  //         "playerId": {
  //           "value": "196327341"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3409,
  //         "recentWinrate": 0.4,
  //         "recentKDA": 7,
  //         "gamesPlayed": 104,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "／party maker＼"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1176450421"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3360,
  //         "recentWinrate": 0.8,
  //         "recentKDA": 9.05,
  //         "gamesPlayed": 49,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "10"
  //       },
  //       {
  //         "playerId": {
  //           "value": "62825856"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3359,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 9.8,
  //         "gamesPlayed": 1418,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Ancient"
  //       },
  //       {
  //         "playerId": {
  //           "value": "229840067"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3345,
  //         "recentWinrate": 0.35,
  //         "recentKDA": 4.6,
  //         "gamesPlayed": 764,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "6.6.6.6騙♞"
  //       },
  //       {
  //         "playerId": {
  //           "value": "253323011"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3340,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 4.1,
  //         "gamesPlayed": 617,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "V"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1062901073"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3325,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 5.7,
  //         "gamesPlayed": 546,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Dota Psychology Professor"
  //       },
  //       {
  //         "playerId": {
  //           "value": "154609335"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3308,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 4.75,
  //         "gamesPlayed": 321,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Xopowo"
  //       },
  //       {
  //         "playerId": {
  //           "value": "84306079"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3305,
  //         "recentWinrate": 0.25,
  //         "recentKDA": 2.75,
  //         "gamesPlayed": 538,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "zlodey"
  //       },
  //       {
  //         "playerId": {
  //           "value": "268808596"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3290,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 4.65,
  //         "gamesPlayed": 879,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Denjke"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1113498050"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3242,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 4.95,
  //         "gamesPlayed": 308,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 1731443540092,
  //           "status": 0
  //         },
  //         "name": "ReggaeRene"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1316075080"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3239,
  //         "recentWinrate": 0.75,
  //         "recentKDA": 5.5,
  //         "gamesPlayed": 1220,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "DARKREEFRISING"
  //       },
  //       {
  //         "playerId": {
  //           "value": "322789114"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3233,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 2.75,
  //         "gamesPlayed": 130,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Thorns of Innocence"
  //       },
  //       {
  //         "playerId": {
  //           "value": "220063849"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3202,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 7.35,
  //         "gamesPlayed": 105,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "ABSOLUT"
  //       },
  //       {
  //         "playerId": {
  //           "value": "434117809"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3185,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 3.85,
  //         "gamesPlayed": 77,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Snejok"
  //       },
  //       {
  //         "playerId": {
  //           "value": "139764353"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3185,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 7.5,
  //         "gamesPlayed": 235,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "dissolutionoftheflesh"
  //       },
  //       {
  //         "playerId": {
  //           "value": "118424666"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3177,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 11.25,
  //         "gamesPlayed": 133,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "紅緒お嬢様"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1526621175"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3166,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 2.75,
  //         "gamesPlayed": 268,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "dota fan from Uzbekistan"
  //       },
  //       {
  //         "playerId": {
  //           "value": "212432211"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3135,
  //         "recentWinrate": 0.7,
  //         "recentKDA": 6.15,
  //         "gamesPlayed": 402,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Osminogha"
  //       },
  //       {
  //         "playerId": {
  //           "value": "116514945"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3134,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 2.4,
  //         "gamesPlayed": 435,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 1731332479375,
  //           "status": 0
  //         },
  //         "name": "Psychology Professor"
  //       },
  //       {
  //         "playerId": {
  //           "value": "372436193"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3131,
  //         "recentWinrate": 0.9,
  //         "recentKDA": 9.05,
  //         "gamesPlayed": 159,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "76561198332701921"
  //       },
  //       {
  //         "playerId": {
  //           "value": "96674626"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3122,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 9.45,
  //         "gamesPlayed": 137,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "chlen abuzer"
  //       },
  //       {
  //         "playerId": {
  //           "value": "148928588"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3094,
  //         "recentWinrate": 0.75,
  //         "recentKDA": 2.25,
  //         "gamesPlayed": 1401,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "torbasow"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1177723926"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3093,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 7.25,
  //         "gamesPlayed": 248,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 1731270458729,
  //           "status": 0
  //         },
  //         "name": "эмммм"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1227179330"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3087,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 8.35,
  //         "gamesPlayed": 108,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "youngbloodz718"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1195851643"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3084,
  //         "recentWinrate": 0.7,
  //         "recentKDA": 12.8,
  //         "gamesPlayed": 69,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "я в гучи ты в буче"
  //       },
  //       {
  //         "playerId": {
  //           "value": "151092826"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3080,
  //         "recentWinrate": 0.7,
  //         "recentKDA": 6.75,
  //         "gamesPlayed": 423,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "animal planet"
  //       },
  //       {
  //         "playerId": {
  //           "value": "114942737"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3080,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 2.9,
  //         "gamesPlayed": 809,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "maslak"
  //       },
  //       {
  //         "playerId": {
  //           "value": "432471626"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3080,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 4.9,
  //         "gamesPlayed": 400,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "ダークフヘブン1337"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1071752914"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3079,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 4.45,
  //         "gamesPlayed": 357,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Loki"
  //       },
  //       {
  //         "playerId": {
  //           "value": "216952339"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3078,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 3.75,
  //         "gamesPlayed": 115,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "towerty"
  //       },
  //       {
  //         "playerId": {
  //           "value": "431077297"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3078,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 4.35,
  //         "gamesPlayed": 563,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "KarmaAkira"
  //       },
  //       {
  //         "playerId": {
  //           "value": "305690166"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3077,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 7.8,
  //         "gamesPlayed": 40,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Imba build"
  //       },
  //       {
  //         "playerId": {
  //           "value": "155507019"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3076,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 2.9,
  //         "gamesPlayed": 334,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Hornet"
  //       },
  //       {
  //         "playerId": {
  //           "value": "189249474"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3064,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 3.5,
  //         "gamesPlayed": 527,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "OLDkitty600 maneuver medullas"
  //       },
  //       {
  //         "playerId": {
  //           "value": "320884231"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3046,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 4.25,
  //         "gamesPlayed": 372,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "BURNOUTED"
  //       },
  //       {
  //         "playerId": {
  //           "value": "110305574"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3044,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 2.95,
  //         "gamesPlayed": 457,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 1726840558835,
  //           "status": 0
  //         },
  //         "name": "TechnoViking"
  //       },
  //       {
  //         "playerId": {
  //           "value": "177406513"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3034,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 4.5,
  //         "gamesPlayed": 180,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "l0l"
  //       },
  //       {
  //         "playerId": {
  //           "value": "293008722"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3025,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 6.85,
  //         "gamesPlayed": 362,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Fake"
  //       },
  //       {
  //         "playerId": {
  //           "value": "309218963"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3024,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 5.95,
  //         "gamesPlayed": 56,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "(  ° □ °)"
  //       },
  //       {
  //         "playerId": {
  //           "value": "217723427"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3006,
  //         "recentWinrate": 0.75,
  //         "recentKDA": 6.3,
  //         "gamesPlayed": 56,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "-.-"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1020931765"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3004,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 5.25,
  //         "gamesPlayed": 39,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "inconceivable"
  //       },
  //       {
  //         "playerId": {
  //           "value": "919653011"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3001,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 4.1,
  //         "gamesPlayed": 743,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Никита Зайцев"
  //       },
  //       {
  //         "playerId": {
  //           "value": "200295795"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 3000,
  //         "recentWinrate": 0.7,
  //         "recentKDA": 4.65,
  //         "gamesPlayed": 44,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Mike"
  //       },
  //       {
  //         "playerId": {
  //           "value": "898733034"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2997,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 4,
  //         "gamesPlayed": 618,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 1726842960097,
  //           "status": 0
  //         },
  //         "name": "NZ AIRLINES"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1424512698"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2996,
  //         "recentWinrate": 0.4,
  //         "recentKDA": 4.25,
  //         "gamesPlayed": 1004,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "求"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1206272854"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2991,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 4.7,
  //         "gamesPlayed": 268,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "дождь"
  //       },
  //       {
  //         "playerId": {
  //           "value": "361575042"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2990,
  //         "recentWinrate": 0.7,
  //         "recentKDA": 10,
  //         "gamesPlayed": 41,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "known cheater"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1075817859"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2978,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 4,
  //         "gamesPlayed": 138,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "qwertyyouriop333"
  //       },
  //       {
  //         "playerId": {
  //           "value": "145616763"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2966,
  //         "recentWinrate": 0.4,
  //         "recentKDA": 5.6,
  //         "gamesPlayed": 521,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "лесной лесник"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1158130677"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2966,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 6.05,
  //         "gamesPlayed": 306,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "ШЕРШЕНЬ 35КГ"
  //       },
  //       {
  //         "playerId": {
  //           "value": "420299018"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2960,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 5,
  //         "gamesPlayed": 70,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": ")"
  //       },
  //       {
  //         "playerId": {
  //           "value": "114472190"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2959,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 9.45,
  //         "gamesPlayed": 179,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "roadto49%"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1184563346"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2944,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 3.95,
  //         "gamesPlayed": 535,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Я не тролль"
  //       },
  //       {
  //         "playerId": {
  //           "value": "280443916"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2943,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 3,
  //         "gamesPlayed": 1354,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "TPOL. ASS vs Evil Bells"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1257761277"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2942,
  //         "recentWinrate": 0.35,
  //         "recentKDA": 4.5,
  //         "gamesPlayed": 120,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "sorry mr alison"
  //       },
  //       {
  //         "playerId": {
  //           "value": "455747329"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2940,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 3.85,
  //         "gamesPlayed": 104,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "MasloUchihaa"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1698909931"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2937,
  //         "recentWinrate": 0.85,
  //         "recentKDA": 6.45,
  //         "gamesPlayed": 24,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Лера"
  //       },
  //       {
  //         "playerId": {
  //           "value": "169584703"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2934,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 6.5,
  //         "gamesPlayed": 993,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Loki"
  //       },
  //       {
  //         "playerId": {
  //           "value": "263314256"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2928,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 7.25,
  //         "gamesPlayed": 122,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Сацума"
  //       },
  //       {
  //         "playerId": {
  //           "value": "398856872"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2926,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 2.85,
  //         "gamesPlayed": 272,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "кушаю бублики"
  //       },
  //       {
  //         "playerId": {
  //           "value": "324792186"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2922,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 4.25,
  //         "gamesPlayed": 235,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "KAMAZ"
  //       },
  //       {
  //         "playerId": {
  //           "value": "153676500"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2914,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 3.55,
  //         "gamesPlayed": 101,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "K3N.憲次"
  //       },
  //       {
  //         "playerId": {
  //           "value": "201046283"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2913,
  //         "recentWinrate": 0.75,
  //         "recentKDA": 6.8,
  //         "gamesPlayed": 50,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Luckman"
  //       },
  //       {
  //         "playerId": {
  //           "value": "10582646"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2911,
  //         "recentWinrate": 0.35,
  //         "recentKDA": 3.35,
  //         "gamesPlayed": 188,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Ju3i vk.com/QuYofam"
  //       },
  //       {
  //         "playerId": {
  //           "value": "182751790"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2909,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 3.6,
  //         "gamesPlayed": 141,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "varg vikernes"
  //       },
  //       {
  //         "playerId": {
  //           "value": "100193858"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2904,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 4.9,
  //         "gamesPlayed": 62,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "lllxc"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1140668194"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2903,
  //         "recentWinrate": 0.7,
  //         "recentKDA": 6.55,
  //         "gamesPlayed": 49,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "дрейнер"
  //       },
  //       {
  //         "playerId": {
  //           "value": "870950483"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2902,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 3,
  //         "gamesPlayed": 541,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "!ПИЗДЫ КОЛПАК"
  //       },
  //       {
  //         "playerId": {
  //           "value": "164797380"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2898,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 3.5,
  //         "gamesPlayed": 114,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Кирюха"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1177376591"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2890,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 4.3,
  //         "gamesPlayed": 152,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "почемучка"
  //       },
  //       {
  //         "playerId": {
  //           "value": "187637192"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2889,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 7.6,
  //         "gamesPlayed": 69,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Darkoss"
  //       },
  //       {
  //         "playerId": {
  //           "value": "918477768"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2889,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 4.5,
  //         "gamesPlayed": 75,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "ХРЯЩ"
  //       },
  //       {
  //         "playerId": {
  //           "value": "183175094"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2888,
  //         "recentWinrate": 0.4,
  //         "recentKDA": 3.85,
  //         "gamesPlayed": 123,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "vac 3.0"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1350458795"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2888,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 3.2,
  //         "gamesPlayed": 1309,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 1731428623135,
  //           "status": 0
  //         },
  //         "name": "sosal>?"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1022761643"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2887,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 5.7,
  //         "gamesPlayed": 61,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Володя 23"
  //       },
  //       {
  //         "playerId": {
  //           "value": "155309191"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2886,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 4.4,
  //         "gamesPlayed": 293,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "ironman pepe"
  //       },
  //       {
  //         "playerId": {
  //           "value": "86970828"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2883,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 2.35,
  //         "gamesPlayed": 450,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "DeathTBO"
  //       },
  //       {
  //         "playerId": {
  //           "value": "195984681"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2881,
  //         "recentWinrate": 0.4,
  //         "recentKDA": 7.1,
  //         "gamesPlayed": 452,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "mode"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1176834103"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2881,
  //         "recentWinrate": 0.8,
  //         "recentKDA": 6.45,
  //         "gamesPlayed": 23,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "кулщо"
  //       },
  //       {
  //         "playerId": {
  //           "value": "122050372"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2880,
  //         "recentWinrate": 0.4,
  //         "recentKDA": 3.5,
  //         "gamesPlayed": 441,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "NamiTsyki"
  //       },
  //       {
  //         "playerId": {
  //           "value": "174806065"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2879,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 2.7,
  //         "gamesPlayed": 710,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Banny_beach"
  //       },
  //       {
  //         "playerId": {
  //           "value": "851499477"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2878,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 4.95,
  //         "gamesPlayed": 416,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "pSRFeAg_u_4"
  //       },
  //       {
  //         "playerId": {
  //           "value": "118576859"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2876,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 4.35,
  //         "gamesPlayed": 77,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "player"
  //       },
  //       {
  //         "playerId": {
  //           "value": "219451757"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2873,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 3.95,
  //         "gamesPlayed": 44,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "predawka"
  //       },
  //       {
  //         "playerId": {
  //           "value": "184629630"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2872,
  //         "recentWinrate": 0.55,
  //         "recentKDA": 4,
  //         "gamesPlayed": 151,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Rayder"
  //       },
  //       {
  //         "playerId": {
  //           "value": "219400269"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2871,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 4.25,
  //         "gamesPlayed": 83,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "island boy"
  //       },
  //       {
  //         "playerId": {
  //           "value": "89703632"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2864,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 1.85,
  //         "gamesPlayed": 211,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "situ"
  //       },
  //       {
  //         "playerId": {
  //           "value": "112935671"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2864,
  //         "recentWinrate": 0.6,
  //         "recentKDA": 4.75,
  //         "gamesPlayed": 116,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Fooboo"
  //       },
  //       {
  //         "playerId": {
  //           "value": "1535631936"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2860,
  //         "recentWinrate": 0.65,
  //         "recentKDA": 4.75,
  //         "gamesPlayed": 27,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "dasnwol"
  //       },
  //       {
  //         "playerId": {
  //           "value": "118711725"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2860,
  //         "recentWinrate": 0.45,
  //         "recentKDA": 4.25,
  //         "gamesPlayed": 211,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "76561198078977453"
  //       },
  //       {
  //         "playerId": {
  //           "value": "146351303"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2860,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 4.6,
  //         "gamesPlayed": 150,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "MoMenTum"
  //       },
  //       {
  //         "playerId": {
  //           "value": "135175802"
  //         },
  //         "version": "Dota_684",
  //         "mmr": 2856,
  //         "recentWinrate": 0.5,
  //         "recentKDA": 2.4,
  //         "gamesPlayed": 119,
  //         "banStatus": {
  //           "isBanned": false,
  //           "bannedUntil": 0,
  //           "status": 2
  //         },
  //         "name": "Shelky"
  //       }
  //     ]
  //   ;
  //
  //   const header = "name,mmr,winrate,games,score";
  //   const data = stuff
  //     .map(it => {
  //       const score = Math.round(
  //         BalanceService.getScore(
  //           it.mmr,
  //           it.recentWinrate,
  //           it.recentKDA,
  //           it.gamesPlayed,
  //         ),
  //       );
  //
  //       return [it.name, it.mmr, it.recentWinrate, it.gamesPlayed, score].join(
  //         ",",
  //       );
  //
  //       // console.log(`[${it.name}] MMR ${it.mmr}, WR ${it.recentWinrate}, Games ${it.gamesPlayed}. Score: ${score}`)
  //     })
  //     .join("\n");
  //
  //   console.log(`${header}\n${data}`);
  // });

  it("should balance this match right", () => {
    const raw = [
      {
        partyId: "Old2",
        players: [
          {
            playerId: {
              value: "1350458795",
            },
            version: "Dota_684",
            mmr: 2888,
            recentWinrate: 0.65,
            recentKDA: 3.2,
            gamesPlayed: 1309,
            banStatus: {
              isBanned: false,
              bannedUntil: 1731428623135,
              status: 0,
            },
            name: "sosal>?",
          },
        ],
      },
      {
        partyId: "Old1",
        players: [
          {
            playerId: {
              value: "1126848000",
            },
            version: "Dota_684",
            mmr: 2781,
            recentWinrate: 0.45,
            recentKDA: 3.75,
            gamesPlayed: 623,
            banStatus: {
              isBanned: false,
              bannedUntil: 1731437403932,
              status: 0,
            },
            name: "AMOGAC",
          },
        ],
      },
      {
        partyId: "Newbie3",
        players: [
          {
            playerId: {
              value: "1665119664",
            },
            version: "Dota_684",
            mmr: 2485,
            recentWinrate: 0.6,
            recentKDA: 2.6,
            gamesPlayed: 5,
            banStatus: {
              isBanned: false,
              bannedUntil: 0,
              status: 2,
            },
            name: "Дубайский шейх",
          },
        ],
      },
      {
        partyId: "Newbie2",
        players: [
          {
            playerId: {
              value: "1840854962",
            },
            version: "Dota_684",
            mmr: 2461,
            recentWinrate: 0.375,
            recentKDA: 2,
            gamesPlayed: 8,
            banStatus: {
              isBanned: false,
              bannedUntil: 0,
              status: 2,
            },
            name: "yy",
          },
        ],
      },
      {
        partyId: "Newbie1",
        players: [
          {
            playerId: {
              value: "478507092",
            },
            version: "Dota_684",
            mmr: 2480,
            recentWinrate: 0.5,
            recentKDA: 1,
            gamesPlayed: 2,
            banStatus: {
              isBanned: false,
              bannedUntil: 0,
              status: 2,
            },
            name: "最強の英雄",
          },
        ],
      },
      {
        partyId: "RX",
        players: [
          {
            playerId: {
              value: "1177028171",
            },
            version: "Dota_684",
            mmr: 4446,
            recentWinrate: 0.7,
            recentKDA: 9.85,
            gamesPlayed: 521,
            banStatus: {
              isBanned: false,
              bannedUntil: 1731354700057,
              status: 0,
            },
            name: "RX",
          },
        ],
      },
      {
        partyId: "V",
        players: [
          {
            playerId: {
              value: "253323011",
            },
            version: "Dota_684",
            mmr: 3340,
            recentWinrate: 0.55,
            recentKDA: 4.1,
            gamesPlayed: 617,
            banStatus: {
              isBanned: false,
              bannedUntil: 0,
              status: 2,
            },
            name: "V",
          },
        ],
      },
      {
        partyId: "Itachi + Lenny + TBR",
        players: [
          {
            playerId: {
              value: "116514945",
            },
            version: "Dota_684",
            mmr: 3134,
            recentWinrate: 0.5,
            recentKDA: 2.4,
            gamesPlayed: 435,
            banStatus: {
              isBanned: false,
              bannedUntil: 1731332479375,
              status: 0,
            },
            name: "Psychology Professor",
          },
          {
            playerId: {
              value: "1177723926",
            },
            version: "Dota_684",
            mmr: 3093,
            recentWinrate: 0.55,
            recentKDA: 7.25,
            gamesPlayed: 248,
            banStatus: {
              isBanned: false,
              bannedUntil: 1731270458729,
              status: 0,
            },
            name: "эмммм",
          },
          {
            playerId: {
              value: "168909035",
            },
            version: "Dota_684",
            mmr: 2793,
            recentWinrate: 0.45,
            recentKDA: 7.3,
            gamesPlayed: 238,
            banStatus: {
              isBanned: false,
              bannedUntil: 0,
              status: 2,
            },
            name: "777",
          },
        ],
      },
    ];

    const entries = raw.map(
      (r) =>
        new QueueEntryModel(
          r.partyId,
          MatchmakingMode.UNRANKED,
          Dota2Version.Dota_684,
          r.players.map(
            (it) =>
              new PlayerInQueueEntity(
                it.playerId,
                BalanceService.getScore(
                  it.mmr,
                  it.recentWinrate,
                  it.recentKDA,
                  it.gamesPlayed,
                ),
              ),
          ),
        ),
    );

    const games = findAllMatchingCombinations(
      10,
      entries,
      (entries) => {
        try {
          BalanceService.rankedBalance(5, entries, false);
          console.log("Hooray?");
          return true;
        } catch (e) {
          console.error(e);
          return false;
        }
      },
      (t) => t.size,
    );

    expect(games).toHaveLength(1);

    const game = games[0];

    const balance = BalanceService.rankedBalance(5, game, false);

    const teams = balance.teams.map((it) => it.parties.map((it) => it.partyID));

    console.log(teams);

    // MMR diff

    // Big party should not be with RX
    expect(
      teams.findIndex(
        (team) => team.includes("Itachi + Lenny + TBR") && team.includes("RX"),
      ),
    ).toEqual(-1);

    // There totally should not be 3 newbies on one team
    expect(
      teams.findIndex(
        (team) => team.filter((t) => t.includes("Newbie")).length > 2,
      ),
    ).toEqual(-1);

    // expect()
  });
});
