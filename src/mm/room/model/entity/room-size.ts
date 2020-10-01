import { MatchmakingMode } from "src/gateway/shared-types/matchmaking-mode";

export const RoomSizes: { [key in MatchmakingMode]: number } = {
  [MatchmakingMode.SOLOMID]: 2,
  [MatchmakingMode.RANKED]: 10,
  [MatchmakingMode.UNRANKED]: 10
};
