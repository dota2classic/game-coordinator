import { PlayerId } from "src/gateway/gateway/shared-types/player-id";

export class CreatePartyCommand {
  constructor(public readonly playerID: PlayerId) {}
}
