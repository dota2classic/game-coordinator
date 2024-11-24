// noinspection JSConstantReassignment

import { Test, TestingModule } from "@nestjs/testing";
import { TestEnvironment } from "@test/cqrs";
import { BalanceService } from "mm/queue/service/balance.service";

function getPlayerMap() {
  const raw = [
    {
      playerId: {
        value: "1177028171",
      },
      version: "Dota_684",
      mmr: 4566,
      recentWinrate: 0.65,
      recentKDA: 5.6,
      gamesPlayed: 558,
      banStatus: {
        isBanned: false,
        bannedUntil: 1732382820073,
        status: 0,
      },
      name: "RX",
    },
    {
      playerId: {
        value: "1316075080",
      },
      version: "Dota_684",
      mmr: 3137,
      recentWinrate: 0.4,
      recentKDA: 2.45,
      gamesPlayed: 1247,
      banStatus: {
        isBanned: false,
        bannedUntil: 1732378265502,
        status: 0,
      },
      name: "DARKREEFRISING",
    },
    {
      playerId: {
        value: "148928588",
      },
      version: "Dota_684",
      mmr: 2948,
      recentWinrate: 0.4,
      recentKDA: 1.65,
      gamesPlayed: 1410,
      banStatus: {
        isBanned: false,
        bannedUntil: 1731951601160,
        status: 4,
      },
      name: "torbasow",
    },
    {
      playerId: {
        value: "120980252",
      },
      version: "Dota_684",
      mmr: 2606,
      recentWinrate: 0.45,
      recentKDA: 3.25,
      gamesPlayed: 1501,
      banStatus: {
        isBanned: false,
        bannedUntil: 0,
        status: 2,
      },
      name: "SittingBull",
    },
    {
      playerId: {
        value: "59565811",
      },
      version: "Dota_684",
      mmr: 3818,
      recentWinrate: 0.8,
      recentKDA: 9.8,
      gamesPlayed: 551,
      banStatus: {
        isBanned: false,
        bannedUntil: 0,
        status: 2,
      },
      name: "трансминьон",
    },
    {
      playerId: {
        value: "160048904",
      },
      version: "Dota_684",
      mmr: 2544,
      recentWinrate: 0.55,
      recentKDA: 2.85,
      gamesPlayed: 57,
      banStatus: {
        isBanned: false,
        bannedUntil: 1731853520130,
        status: 0,
      },
      name: "Причина тряски?",
    },
    {
      playerId: {
        value: "1840854962",
      },
      version: "Dota_684",
      mmr: 2654,
      recentWinrate: 0.65,
      recentKDA: 4.6,
      gamesPlayed: 34,
      banStatus: {
        isBanned: false,
        bannedUntil: 1731863766522,
        status: 1,
      },
      name: "la vita",
    },
    {
      playerId: {
        value: "253323011",
      },
      version: "Dota_684",
      mmr: 3305,
      recentWinrate: 0.55,
      recentKDA: 5.95,
      gamesPlayed: 665,
      banStatus: {
        isBanned: false,
        bannedUntil: 0,
        status: 2,
      },
      name: "V",
    },
    {
      playerId: {
        value: "1247368846",
      },
      version: "Dota_684",
      mmr: 2406,
      recentWinrate: 0.45,
      recentKDA: 0.95,
      gamesPlayed: 44,
      banStatus: {
        isBanned: false,
        bannedUntil: 0,
        status: 2,
      },
      name: "Стapый Дoбpый Пpикoл",
    },
    {
      playerId: {
        value: "1044738317",
      },
      version: "Dota_684",
      mmr: 2780,
      recentWinrate: 0.7272727272727273,
      recentKDA: 4.636363636363637,
      gamesPlayed: 11,
      banStatus: {
        isBanned: false,
        bannedUntil: 1732135106727,
        status: 4,
      },
      name: "supp diff",
    },
    {
      playerId: {
        value: "116514945",
      },
      version: "Dota_684",
      mmr: 3117,
      recentWinrate: 0.55,
      recentKDA: 2.65,
      gamesPlayed: 443,
      banStatus: {
        isBanned: false,
        bannedUntil: 1731846630186,
        status: 4,
      },
      name: "Psychology Professor",
    },
    {
      playerId: {
        value: "1127420281",
      },
      version: "Dota_684",
      mmr: 2558,
      recentWinrate: 0.5,
      recentKDA: 0.85,
      gamesPlayed: 433,
      banStatus: {
        isBanned: false,
        bannedUntil: 1732374866368,
        status: 0,
      },
      name: "просто хлеб",
    },
  ];
  const asMap = {};
  raw.forEach((entry) => {
    asMap[entry.playerId.value] = {
      name: entry.name,
      mmr: entry.mmr,
      gamesPlayed: entry.gamesPlayed,
      winrate: entry.recentWinrate,
    };
  });
  return asMap;
}

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

  const playerMap = getPlayerMap();
  const lenny = "59565811";
  const itachi = "116514945";
  const sb = "120980252";
  const gosha = "148928588";
  const newbie60gamesWR55 = "160048904";
  const visun = "253323011";
  const suppdiff = "1044738317";
  const rx = "1177028171";
  const newbie50gamesWR45 = "1247368846";
  const newbie40gamesWR65 = "1840854962";
  const sirko = "1316075080";
  const hleb = "1127420281";

  const score = (id: string) => {
    const r = playerMap[id];
    return BalanceService.getScore(r.mmr, r.winrate, 0, r.gamesPlayed);
  };

  // Balance is hard. We can check if new balancing thingy falls into our constraints

  it("rx > itachi", () => {
    expect(score(rx)).toBeGreaterThan(score(itachi));
  });

  it("rx ~ 1.5 itachi", () => {
    expect(Math.abs(score(rx) / score(itachi) - 1.5)).toBeLessThan(0.3);
  });

  it("rx ~ 1.5 visun", () => {
    expect(Math.abs(score(rx) / score(visun) - 1.5)).toBeLessThan(0.3);
  });

  it("itachi ~ 1.5 hleb", () => {
    expect(Math.abs(score(itachi) / score(hleb) - 1.5)).toBeLessThan(0.3);
  });

  it("rx ~ 2 hleb", () => {
    console.log(score(rx), score(hleb));
    expect(Math.abs(score(rx) / score(hleb) - 2)).toBeLessThan(0.3);
  });

  it("lenny ~ 1.2 itachi", () => {
    expect(Math.abs(score(lenny) / score(itachi) - 1.2)).toBeLessThan(0.2);
  });

  it("gosha < itachi", () => {
    expect(score(itachi)).toBeGreaterThan(score(gosha));
  });

  it("sittinbull < gosha", () => {
    expect(score(gosha)).toBeGreaterThan(score(sb));
  });

  it("rx > visun", () => {
    expect(score(rx)).toBeGreaterThan(score(visun));
  });

  it("lenny > itachi", () => {
    expect(score(lenny)).toBeGreaterThan(score(itachi));
  });

  it("rx ~ 3 (50games, 45winrate)", () => {
    expect(Math.abs(score(rx) / score(newbie50gamesWR45) - 3)).toBeLessThan(
      0.3,
    );
  });

  it("should pad winrate", () => {
    const newbiewin = BalanceService.getScore(2500, 1, 0, 1);
    const newbielose = BalanceService.getScore(2500, 0, 0, 1);
    const newbiewin5 = BalanceService.getScore(2500, 0.8, 0, 5);
    const rawNewbie = BalanceService.getScore(2500, 0.5, 0, 0);
    expect(newbielose).toBeLessThan(newbiewin)
    expect(newbiewin).toBeLessThan(newbiewin5)
    expect(rawNewbie).toBeLessThan(newbielose)
  });

  it("34games, 65winrate > 50games, 45winrate", () => {
    expect(score(newbie40gamesWR65)).toBeGreaterThan(score(newbie50gamesWR45));
  });
  it("11games, 72winrate > 50games, 45winrate", () => {
    expect(score(suppdiff)).toBeGreaterThan(score(newbie50gamesWR45));
  });

  it("should result in a low score if no games are played", () => {
    const newbieScore = BalanceService.getScore(2500, 0.5, 0, 0);
    const newbie2Score = BalanceService.getScore(2500, 0.5, 0, 3);
    const decentScore = BalanceService.getScore(2500, 0.5, 0, 50);

    expect(decentScore / Math.max(1, newbieScore)).toBeGreaterThan(10);
    expect(decentScore / Math.max(1, newbie2Score)).toBeGreaterThan(2);
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
