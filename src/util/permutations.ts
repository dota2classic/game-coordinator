import { QueueEntryModel } from "../mm/queue/model/queue-entry.model";
import { performance } from "perf_hooks";

export function* subsetSum(
  pool: QueueEntryModel[],
  target: number,
  partial: QueueEntryModel[] = [],
): Generator<QueueEntryModel[]> {
  let plrCount = partial.reduce((a, x) => a + x.players.length, 0);

  // check if the partial sum is equals to target
  if (plrCount === target) {
    // total.push(partial);
    yield partial;
  }
  if (plrCount >= target) {
    return; // if we reach the number why bother to continue
  }

  for (let i = 0; i < pool.length; i++) {
    let n = pool[i];
    let remaining = pool.slice(i + 1);
    yield* subsetSum(remaining, target, partial.concat([n]));
  }
}

export function findMatch(
  pool: QueueEntryModel[],
  target: number,
  predicate: (left: QueueEntryModel[], right: QueueEntryModel[]) => boolean,
): [QueueEntryModel[], QueueEntryModel[]] {
  const leftG = subsetSum(pool, target);
  for (let left of leftG) {
    const subpool = pool.filter(
      (t) =>
        left.findIndex((leftParty) => leftParty.partyID === t.partyID) === -1,
    );

    const rightG = subsetSum(subpool, target);

    for (let right of rightG) {
      if (predicate(left, right)) {
        return [left, right];
      }
    }
  }
  return undefined;
}

export function findBestMatchBy(
  pool: QueueEntryModel[],
  target: number,
  func: (left: QueueEntryModel[], right: QueueEntryModel[]) => number,
  timeLimitation: number,
  acceptableThreshold: number | undefined = undefined,
): [QueueEntryModel[], QueueEntryModel[]] | undefined {
  let timeStarted = performance.now();

  let bestScore = Number.MAX_SAFE_INTEGER;
  let bestPair: [QueueEntryModel[], QueueEntryModel[]] | undefined = undefined;

  const leftG = subsetSum(pool, target);
  for (let left of leftG) {
    const subpool = pool.filter(
      (t) =>
        left.findIndex((leftParty) => leftParty.partyID === t.partyID) === -1,
    );

    const rightG = subsetSum(subpool, target);

    for (let right of rightG) {
      let score = func(left, right);
      if (acceptableThreshold && score < acceptableThreshold) {
        return [left, right];
      }

      if (score < bestScore) {
        bestScore = score;
        bestPair = [left, right];
      }
      const time = performance.now() - timeStarted;
      if (time > timeLimitation) {
        // We have to quit now
        return bestPair;
      }
    }
  }
  return bestPair;
}
