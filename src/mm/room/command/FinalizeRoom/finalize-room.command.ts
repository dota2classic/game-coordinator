import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { RoomReadyState } from "gateway/gateway/events/room-ready-check-complete.event";

export class FinalizeRoomCommand {
  constructor(
    public readonly roomId: string,
    public readonly mode: MatchmakingMode,
    public readonly state: RoomReadyState,
  ) {}
}
