import {
  findAllCombinations,
  findAllMatchingCombinations,
  findFirstCombination,
} from "util/combinations";
import { range } from "util/range";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import {
  MatchmakingMode,
  RoomSizes,
} from "gateway/gateway/shared-types/matchmaking-mode";
import { BalanceService } from "mm/queue/service/balance.service";
import { randomPiq } from "util/randomPlayerInQueue";
import { Dota2Version } from "../gateway/gateway/shared-types/dota2version";

const f: number[] = [];
function factorial(n) {
  if (n == 0 || n == 1) return 1;
  if (f[n] > 0) return f[n];
  return (f[n] = factorial(n - 1) * n);
}

const combCount = (n: number, r: number) =>
  factorial(n) / (factorial(r) * factorial(n - r));

describe(`combinations`, () => {
  it("should find right combinations", () => {
    const results = findAllCombinations(2, [1, 2, 3]);
    expect(results.length).toEqual(3);
  });

  it("should find right combinations of big array", () => {
    const arr = new Array(100).fill(null).map((_, index) => index);
    const comb = 2;
    const results = findAllCombinations(comb, arr);
    expect(results.length).toEqual(combCount(arr.length, comb));
  });

  it("should find first right combo", () => {
    expect(
      findFirstCombination(2, [1, 2, 3], combo => {
        return combo.reduce((a, b) => a + b, 0) > 4;
      }),
    ).toEqual([2, 3]);

    expect(
      findFirstCombination(2, [1, 2, 3], combo => {
        return combo.reduce((a, b) => a + b, 0) > 3;
      }),
    ).toEqual([1, 3]);

    expect(
      findFirstCombination(2, [1, 2, 3], combo => {
        return combo.reduce((a, b) => a + b, 0) > 2;
      }),
    ).toEqual([1, 2]);
  });

  it("should respect unit size", () => {
    const results = findAllCombinations(2, [1, 2, 3], t =>
      t % 2 === 0 ? 2 : 1,
    );
    expect(results.length).toEqual(2);
    expect(results).toEqual([[1, 3], [2]]);

    const results2 = findAllCombinations(2, [1, 2, 3], () => 2);
    expect(results2.length).toEqual(3);
    expect(results2).toEqual([[1], [2], [3]]);
  });

  it("should work on queue entries", () => {
    const qSize = 25;
    const mode = MatchmakingMode.RANKED;

    const arr = range(qSize).map((_, index) => {
      const players = new Array(Math.round(Math.random() * 2 + 1))
        .fill(null)
        .map(() => {
          return randomPiq();
        });

      return new QueueEntryModel(
        `party${index}_${players.length}`,
        mode,
        players,
        BalanceService.getTotalScore(players),
        Dota2Version.Dota_684
      );
    });

    const teamSize = Math.round(RoomSizes[mode] / 2);

    const games = findAllMatchingCombinations(
      RoomSizes[mode],
      arr,
      entries => {
        try {
          BalanceService.rankedBalance(teamSize, entries);
          return true;
        } catch (e) {
          return false;
        }
      },
      t => t.size,
    );

    // console.log(
    //   "In queue: ",
    //   arr.reduce((a, b) => a + b.size, 0),
    // );
    if (games.length === 0) {
      console.log("No games found");
    }
    // games
    //   .map(t => BalanceService.rankedBalance(teamSize, t))
    //   .forEach(b => {
    //     console.log(
    //       JSON.stringify({
    //         ...b,
    //         average: b.averageMMR,
    //         total: b.totalMMR,
    //         median: b.mmrMedian,
    //       }),
    //     );
    //   });
  });
});
