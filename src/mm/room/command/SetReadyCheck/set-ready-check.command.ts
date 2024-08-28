import { PlayerId } from "gateway/gateway/shared-types/player-id";
import { ReadyState } from "gateway/gateway/events/ready-state-received.event";

export class SetReadyCheckCommand {
  constructor(
    public readonly playerId: PlayerId,
    public readonly roomId: string,
    public readonly state: ReadyState,
  ) {}
}
