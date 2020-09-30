import { PlayerId } from "src/mm/player/model/player.model";

export class CreatePartyCommand {
  constructor(public readonly playerID: PlayerId) {
  }
}