import { AggregateRoot } from "@nestjs/cqrs";
import { uuid } from "src/@shared/generateID";
import { RoomEntry } from "src/mm/room/model/room-entry";
import { RoomBalance } from "src/mm/room/model/entity/room-balance";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";
import { ReadyState } from "src/gateway/gateway/events/ready-state-received.event";
import {
  ReadyCheckEntry,
  RoomReadyCheckCompleteEvent,
  RoomReadyState,
} from "src/gateway/gateway/events/room-ready-check-complete.event";
import { ReadyCheckStartedEvent } from "src/gateway/gateway/events/ready-check-started.event";
import { ReadyStateUpdatedEvent } from "src/gateway/gateway/events/ready-state-updated.event";
import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";

export class RoomModel extends AggregateRoot {
  public readonly id: string = uuid();

  private readonly readyCheckMap = new Map<PlayerId, ReadyState>();
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
    public readonly entries: RoomEntry[],
    public readonly balance: RoomBalance,
  ) {
    super();
  }

  startReadyCheck() {
    this.players.forEach(t => this.readyCheckMap.set(t.id, ReadyState.PENDING));
    this.readyCheckComplete = false;
    this.apply(
      new ReadyCheckStartedEvent(
        this.id,
        this.mode,
        [...this.readyCheckMap.entries()].map(
          ([id, state]) => new ReadyCheckEntry(id, state),
        ),
        this.readyCheckState,
      ),
    );
  }

  readyCheckTimeout() {
    if (this.readyCheckComplete) return;
    this.players.forEach(t => {
      if (this.readyCheckMap.get(t.id) === ReadyState.PENDING) {
        this.readyCheckMap.set(t.id, ReadyState.TIMEOUT);
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

    if (this.players.find(t => t.id.value === playerId.value)) {
      this.readyCheckMap.set(playerId, state);
      this.apply(
        new ReadyStateUpdatedEvent(this.id, this.mode, this.readyCheckState),
      );
      if (this.acceptedCount === this.players.length) {
        this.completeReadyCheck();
      }
    }
  }

  private get readyCheckState(): RoomReadyState {
    return {
      accepted: this.acceptedCount,
      total: this.players.length,
    };
  }
}
