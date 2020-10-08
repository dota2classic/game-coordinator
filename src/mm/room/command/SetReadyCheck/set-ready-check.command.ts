import {PlayerId} from "src/gateway/gateway/shared-types/player-id";
import {ReadyState} from "src/gateway/gateway/events/ready-state-received.event";

export class SetReadyCheckCommand {
  constructor(
    public readonly playerId: PlayerId,
    public readonly roomId: string,
    public readonly state: ReadyState,
  ) {}
}
