import { AggregateRoot } from "@nestjs/cqrs";
import { uuid } from "src/@shared/uuid";

export class RoomModel extends AggregateRoot {

  public readonly id: string = uuid();

  constructor() {
    super();
  }
}