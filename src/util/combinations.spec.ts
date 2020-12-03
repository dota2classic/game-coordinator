import {
  findAllCombinations,
  findFirstCombination,
} from "src/util/combinations";

describe(`combinations`, () => {
  it("should find right combinations", () => {
    const results = findAllCombinations(2, [1, 2, 3]);
    expect(results.length).toEqual(3);
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
});
