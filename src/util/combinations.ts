// comb
// C (m, n) = n! / (n - m)! * m!

export function findAllCombinations<T>(
  comboLength: number,
  sourceArray: T[],
  unitSize: (t: T) => number = () => 1,
): T[][] {
  const combos: T[][] = [];
  iterateCombinations(
    sourceArray,
    comboLength,
    z => {
      combos.push(z);
      return true;
    },
    unitSize,
  );

  return combos;
}

function iterateCombinations<T>(
  sourceArray: T[],
  comboLength: number,
  callback: (combo: T[]) => boolean,
  itemSize: (t: T) => number = () => 1,
) {
  const sourceLength = sourceArray.length;
  // if (comboLength > sourceLength) return [];

  const makeNextCombos = (
    workingCombo,
    currentIndex: number,
    remainingCount: number,
  ) => {
    // For each element that remaines to be added to the working combination.
    for (
      let sourceIndex: number = currentIndex;
      sourceIndex < sourceLength;
      sourceIndex++
    ) {
      const size = itemSize(sourceArray[sourceIndex]);

      const oneAwayFromComboLength = remainingCount == size;

      // Get next (possibly partial) combination.
      const next = [...workingCombo, sourceArray[sourceIndex]];

      if (oneAwayFromComboLength) {
        // Combo of right length found, save it.
        const goOn = callback(next);
        if (!goOn) {
          return false;
        }
      } else {
        // Otherwise go deeper to add more elements to the current partial combination.

        const goOn = makeNextCombos(
          next,
          sourceIndex + 1,
          remainingCount - size,
        );
        if (!goOn) return false;
      }
    }
    return true;
  };

  makeNextCombos([], 0, comboLength);
}

export function findFirstCombination<T>(
  groupSize: number,
  source: T[],
  predicate: (c: T[]) => boolean,
  unitSize: (t: T) => number = () => 1,
): T[] | undefined {
  let found: T[] | undefined = undefined;
  iterateCombinations(
    source,
    groupSize,
    c => {
      const isGood = predicate(c);

      if (isGood) {
        found = c;
        return false;
      }
      return true;
    },
    unitSize,
  );

  return found;
}

export function findAllMatchingCombinations<T>(
  groupSize: number,
  sourceArray: T[],
  predicate: (c: T[]) => boolean,
  unitSize: (t: T) => number = () => 1,
): T[][] {
  const sourceArrayCopy = [...sourceArray];
  const foundMatches: T[][] = [];

  while (true) {
    const found = findFirstCombination<T>(
      groupSize,
      sourceArrayCopy,
      predicate,
      unitSize,
    );

    if (!found) break;

    foundMatches.push(found);

    found.forEach(t => {
      const found = sourceArrayCopy.findIndex(z => z === t);

      if (found === -1) throw "Something wrong";
      sourceArrayCopy.splice(found, 1);
    });
  }

  return foundMatches;
}
