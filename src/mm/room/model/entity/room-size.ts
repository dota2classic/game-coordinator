import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
export const RoomSizes: { [key in MatchmakingMode]: number } = {
  [MatchmakingMode.SOLOMID]: 2,
  [MatchmakingMode.RANKED]: 10,
  [MatchmakingMode.UNRANKED]: 10,
  [MatchmakingMode.DIRETIDE]: 10,
  [MatchmakingMode.GREEVILING]: 10,
  [MatchmakingMode.TOURNAMENT]: 10,
  [MatchmakingMode.ABILITY_DRAFT]: 10,
};