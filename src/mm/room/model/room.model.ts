import { AggregateRoot } from "@nestjs/cqrs";
import { uuid } from "src/@shared/generateID";
import { RoomEntry } from "src/mm/room/model/room-entry";
import { RoomBalance } from "src/mm/room/model/entity/room-balance";

export class RoomModel extends AggregateRoot {
  public readonly id: string = uuid();

  constructor(
    public readonly entries: RoomEntry[],
    public readonly balance: RoomBalance,
  ) {
    super();
  }
}
