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
        Dota2Version.Dota_684,
        players,
      );
    });

    const teamSize = Math.round(RoomSizes[mode] / 2);

    const games = findAllMatchingCombinations(
      RoomSizes[mode],
      arr,
      entries => {
        try {
          BalanceService.rankedBalance(teamSize, entries, false);
          return true;
        } catch (e) {
          return false;
        }
      },
      t => t.size,
    );

    expect(games.length).toBeGreaterThanOrEqual(4);
  });

  it("should respect array order", () => {
    const results = findAllCombinations(2, [1, 2, 3, 4]);
    expect(results).toEqual([[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]);
  });
});
