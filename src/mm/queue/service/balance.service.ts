import { Injectable } from "@nestjs/common";
import { RoomBalance, TeamEntry } from "mm/room/model/entity/room-balance";
import { BalanceException } from "mm/queue/exception/balance.exception";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";

@Injectable()
export class BalanceService {

  private static getPartyFactor(count: number): number {
    // keep score same for single players and higher for parties
    // return 1 + 0.1 * (count - 1);
    // ok lets not increase it for parties.
    return 1;
  }

  static EXPERIENCE_FACTOR = 2.0;
  static MMR_FACTOR = 1.0;
  static TARGET_WINRATE = 0.5;


  public static soloMidBalance(teamSize: number, entries: QueueEntryModel[]) {
    const isPartySolomid =
      entries.length === 1 && entries[0].players.length === 2;

    if (isPartySolomid) {
      const entry = entries[0];
      return new RoomBalance([
        new TeamEntry([
          new QueueEntryModel(entry.partyID, entry.mode, entry.version, [
            entry.players[0],
          ]),
        ]),
        new TeamEntry([
          new QueueEntryModel(entry.partyID, entry.mode, entry.version, [
            entry.players[1],
          ]),
        ]),
      ]);
    }

    if (entries.length !== 2) throw new BalanceException();
    return new RoomBalance(
      [[entries[0]], [entries[1]]].map((list) => new TeamEntry(list, 0)),
    );
  }
}
