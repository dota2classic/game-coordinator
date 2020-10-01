import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";

export const RoomSizes: { [key in MatchmakingMode]: number } = {
  [MatchmakingMode.SOLOMID]: 2,
};
