import {PlayerId} from "src/gateway/gateway/shared-types/player-id";


export class RoomReadyCheckCommand {
  constructor(public readonly roomID: string, public readonly players: PlayerId[]) {
  }
}