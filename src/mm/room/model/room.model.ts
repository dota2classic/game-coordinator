import {AggregateRoot} from "@nestjs/cqrs";
import {uuid} from "src/@shared/generateID";
import {RoomEntry} from "src/mm/room/model/room-entry";
import {RoomBalance} from "src/mm/room/model/entity/room-balance";
import {PlayerId} from "src/gateway/gateway/shared-types/player-id";
import {ReadyState} from "src/gateway/gateway/events/ready-state-received.event";
import {
  ReadyCheckEntry,
  RoomReadyCheckCompleteEvent,
  RoomReadyState,
} from "src/gateway/gateway/events/room-ready-check-complete.event";
import {ReadyCheckStartedEvent} from "src/gateway/gateway/events/ready-check-started.event";
import {ReadyStateUpdatedEvent} from "src/gateway/gateway/events/ready-state-updated.event";
import {MatchmakingMode} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {PlayerDeclinedGameEvent} from "src/gateway/gateway/events/mm/player-declined-game.event";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";

export class RoomModel extends AggregateRoot {
  public readonly id: string = uuid();

  private readonly readyCheckMap = new Map<string, ReadyState>();
  private readyCheckComplete = false;

  public get players() {
    return this.entries.flatMap(t => t.players);
  }

  private get acceptedCount() {
    return [...this.readyCheckMap.values()].filter(t => t === ReadyState.READY)
      .length;
  }

  constructor(
    public readonly mode: MatchmakingMode,
    public readonly entries: QueueEntryModel[],
    public readonly balance: RoomBalance,
    public readonly version: Dota2Version
  ) {
    super();
  }

  startReadyCheck() {
    this.players.forEach(t =>
      this.readyCheckMap.set(t.playerId.value, ReadyState.PENDING),
    );
    this.readyCheckComplete = false;
    this.apply(
      new ReadyCheckStartedEvent(
        this.id,
        this.mode,
        [...this.readyCheckMap.entries()].map(
          ([id, state]) => new ReadyCheckEntry(new PlayerId(id), state),
        ),
        this.readyCheckState,
      ),
    );
  }

  readyCheckTimeout() {
    if (this.readyCheckComplete) return;
    this.players.forEach(t => {
      if (this.readyCheckMap.get(t.playerId.value) === ReadyState.PENDING) {
        this.readyCheckMap.set(t.playerId.value, ReadyState.TIMEOUT);
        this.apply(new PlayerDeclinedGameEvent(t.playerId))
      }
    });
    this.completeReadyCheck();
  }

  completeReadyCheck() {
    this.readyCheckComplete = true;
    this.apply(
      new RoomReadyCheckCompleteEvent(this.id, this.mode, this.readyCheckState),
    );
  }

  setReadyCheck(playerId: PlayerId, state: ReadyState) {
    // no-no, nothing here.
    if (this.readyCheckComplete) return;

    if (this.players.find(t => t.playerId.value === playerId.value)) {
      // one vote for one guy
      if (this.readyCheckMap.get(playerId.value) !== ReadyState.PENDING) return;

      this.readyCheckMap.set(playerId.value, state);
      this.apply(
        new ReadyStateUpdatedEvent(
          this.id,
          this.mode,
          [...this.readyCheckMap.entries()].map(
            ([id, state]) => new ReadyCheckEntry(new PlayerId(id), state),
          ),
          this.readyCheckState,
        ),
      );
      if (this.acceptedCount === this.players.length) {
        this.completeReadyCheck();
      } else if (state === ReadyState.DECLINE) {
        // if it's explicit decline, we do so:
        // everybody except explicit decline we set as ready
        // and finish ready check.
        [...this.readyCheckMap.keys()].forEach(t => {
          if (t !== playerId.value) {
            this.readyCheckMap.set(t, ReadyState.READY);
          }
        });

        this.apply(new PlayerDeclinedGameEvent(playerId))
        this.completeReadyCheck();
      }
    }
  }

  public get readyCheckState(): RoomReadyState {
    return {
      accepted: this.acceptedCount,
      total: this.players.length,
    };
  }

  public didAccept(pid: PlayerId): boolean {
    return this.readyCheckMap.get(pid.value) === ReadyState.READY;
  }

  getAcceptedParties() {
    return this.entries.filter(t => {
      // if all from this party accepted, we re count them as good
      return t.players.reduce((total, b) => {
        return total && this.readyCheckMap.get(b.playerId.value) === ReadyState.READY;
      }, true);
    });
  }
}
