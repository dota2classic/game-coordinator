import { BalanceService } from "./balance.service";

export type BalanceProvider = (
  mmr: number,
  recentWinrate: number,
  games: number,
) => number;

export const BalancerV0: BalanceProvider = (mmr, wrLast20Games, gamesPlayed) => {

  // B2 * ((MIN(D2, 90) + 10) / 100)* (C2 + 0.5)

  const EDUCATION_THRESHOLD = 10;

  // Education factor: the less games you have, the less score you will end up with
  const educationFactor =
    (Math.min(gamesPlayed, EDUCATION_THRESHOLD - 1) + 1) /
    EDUCATION_THRESHOLD;

  // Experience factor: if you have a lot of games, its diminishing returns, so we use log
  const experienceFactor = Math.log10(
    Math.min(500, Math.max(10, gamesPlayed)),
  );

  const mmrScore = mmr * BalanceService.MMR_FACTOR;

  // To prevent correction if newbie won his first game, we pad 20 games with 50% winrate
  let realWinrate = wrLast20Games;
  const padCount = 10;
  if (gamesPlayed < padCount) {
    const wonPlayedGames = wrLast20Games * gamesPlayed;
    const wonPaddedGames = Math.round(
      (padCount - gamesPlayed) * BalanceService.TARGET_WINRATE,
    );

    realWinrate = (wonPlayedGames + wonPaddedGames) / padCount;
  }

  const winrateFactor = realWinrate + BalanceService.TARGET_WINRATE;

  return mmrScore * (winrateFactor + experienceFactor) * educationFactor;
}


export const LegacyBalancer: BalanceProvider = (mmr, wr, games) => {
  const EDUCATION_THRESHOLD = 10;

  // Education factor: the less games you have, the less score you will end up with
  const educationFactor =
    (Math.min(games, EDUCATION_THRESHOLD - 1) + 1) /
    EDUCATION_THRESHOLD;

  // Experience factor: if you have a lot of games, its diminishing returns, so we use log
  const experienceFactor = Math.log(
    Math.max(EDUCATION_THRESHOLD, games),
  );

  const mmrScore = mmr * BalanceService.MMR_FACTOR;

  const winrateFactor = wr + BalanceService.TARGET_WINRATE;

  return mmrScore * educationFactor * experienceFactor * winrateFactor;
}
