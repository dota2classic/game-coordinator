import { Injectable } from "@nestjs/common";
import { RuntimeRepository } from "src/@shared/runtime-repository";
import { RoomModel } from "src/mm/room/model/room.model";
import { EventPublisher } from "@nestjs/cqrs";

@Injectable()
export class RoomRepository extends RuntimeRepository<RoomModel, "id"> {

  constructor(publisher: EventPublisher) {
    super(publisher);
  }
}