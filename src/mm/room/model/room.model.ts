import { AggregateRoot } from "@nestjs/cqrs";
import { uuid } from "src/@shared/uuid";
import { RoomEntry } from "src/mm/room/model/room-entry";

export class RoomModel extends AggregateRoot {
  public readonly id: string = uuid();

  constructor(public readonly entries: RoomEntry[]) {
    super();
  }
}