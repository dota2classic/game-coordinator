import { Test, TestingModule } from "@nestjs/testing";
import { NestApplication } from "@nestjs/core";
import { MmModule } from "../mm.module";
import { CommandBus, Constructor, EventBus, ofType } from "@nestjs/cqrs";
import { CreateQueueCommand } from "../queue/command/CreateQueue/create-queue.command";
import { MatchmakingMode } from "../../gateway/gateway/shared-types/matchmaking-mode";
import { Dota2Version } from "../../gateway/gateway/shared-types/dota2version";
import { EnterQueueCommand } from "../queue/command/EnterQueue/enter-queue.command";
import { PlayerInQueueEntity } from "../queue/model/entity/player-in-queue.entity";
import { randomUser } from "../../@test/values";
import { GameCheckCycleEvent } from "../queue/event/game-check-cycle.event";
import { SetReadyCheckCommand } from "../room/command/SetReadyCheck/set-ready-check.command";
import { firstValueFrom } from "rxjs";
import { RoomCreatedEvent } from "../room/event/room-created.event";
import { ReadyState } from "../../gateway/gateway/events/ready-state-received.event";
import { RoomReadyEvent } from "../../gateway/gateway/events/room-ready.event";
import { QueueRepository } from "../queue/repository/queue.repository";
import { QueueModel } from "../queue/model/queue.model";
import { PlayerId } from "../../gateway/gateway/shared-types/player-id";

async function awaitEvent<T>(
  ebus: EventBus,
  type: Constructor<T>,
  timeout = 5000,
) {
  return firstValueFrom(ebus.pipe(ofType(type)));
}

describe("Enter queue into accept flow", () => {
  jest.setTimeout(1000);

  let module: TestingModule;
  let app: NestApplication;

  let ebus: EventBus;
  let cbus: CommandBus;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MmModule],
      controllers: [],
      // providers: [...TestEnvironment()],
    }).compile();

    app = module.createNestApplication();

    ebus = app.get(EventBus);
    cbus = app.get(CommandBus);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    [MatchmakingMode.SOLOMID, 2],
    [MatchmakingMode.UNRANKED, 10],
    [MatchmakingMode.BOTS, 1],
  ])(
    `should create room, ready check, room ready, clean queue when mode is %s`,
    async (mode: MatchmakingMode, playerCnt: number) => {
      await cbus.execute(new CreateQueueCommand(mode, Dota2Version.Dota_684));

      const users: PlayerId[] = [];

      for (let i = 0; i < playerCnt; i++) {
        const u1 = randomUser();
        users.push(u1);
        await cbus.execute(
          new EnterQueueCommand(
            u1.value,
            [new PlayerInQueueEntity(u1, 100)],
            mode,
            Dota2Version.Dota_684,
          ),
        );
      }

      const $roomCreatedEvent = awaitEvent(ebus, RoomCreatedEvent);
      const $roomReadyEvent = awaitEvent(ebus, RoomReadyEvent);

      await ebus.publish(new GameCheckCycleEvent(mode, Dota2Version.Dota_684));

      const room = await $roomCreatedEvent;

      for (let user of users) {
        await cbus.execute(
          new SetReadyCheckCommand(user, room.id, ReadyState.READY),
        );
      }

      const roomReadyEvent = await $roomReadyEvent;

      expect(roomReadyEvent.mode).toEqual(mode);
      expect(roomReadyEvent.version).toEqual(Dota2Version.Dota_684);
      expect(roomReadyEvent.roomId).toEqual(room.id);
      expect(
        roomReadyEvent.players.map((it) => it.playerId.value).sort(),
      ).toMatchObject(
        users.map((playerId) => playerId.value).sort() satisfies string[],
      );

      const q = await app
        .get(QueueRepository)
        .get(QueueModel.id(mode, Dota2Version.Dota_684));

      expect(q.entries).toHaveLength(0);
    },
  );
});
