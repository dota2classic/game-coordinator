import { RuntimeRepository } from "src/@shared/runtime-repository";
import { PartyModel } from "src/mm/party/model/party.model";
import { EventPublisher } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { PlayerId } from "src/mm/player/model/player.model";


@Injectable()
export class PartyRepository extends RuntimeRepository<PartyModel, "id"> {
  constructor(publisher: EventPublisher) {
    super(publisher);
  }


  async findExistingParty(pid: PlayerId) {
    return [...this.cache.values()].find(it => it.players.find(z => z === pid));
  }

}