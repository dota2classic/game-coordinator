import { RuntimeRepository } from "src/@shared/runtime-repository";
import { PartyModel } from "src/mm/party/model/party.model";
import { EventPublisher } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";
import { uuid } from "src/@shared/generateID";

@Injectable()
export class PartyRepository extends RuntimeRepository<PartyModel, "id"> {
  constructor(publisher: EventPublisher) {
    super(publisher);
  }

  async findExistingParty(pid: PlayerId) {
    return [...this.cache.values()].find(it => it.players.find(z => z.value === pid.value));
  }

  async getPartyOf(id?: PlayerId) {
    const parties = await this.all();
    const party = parties.find(it => it.players.find(z => z.value == id.value));

    if (!party) {
      const p = new PartyModel(uuid(), id, [id]);
      await this.save(p.id, p);
      p.created();
      p.commit();

      return p;
    }
    return party;
  }
}
