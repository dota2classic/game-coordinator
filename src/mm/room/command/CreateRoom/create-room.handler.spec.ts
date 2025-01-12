import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { RoomProviders } from "mm/room";
import { CreateRoomHandler } from "mm/room/command/CreateRoom/create-room.handler";
import { CreateRoomCommand } from "mm/room/command/CreateRoom/create-room.command";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { RoomCreatedEvent } from "mm/room/event/room-created.event";
import { randomUser } from "@test/values";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { Dota2Version } from "../../../../gateway/gateway/shared-types/dota2version";
import { QueueEntryModel } from "../../../queue/model/queue-entry.model";
import { RoomBalance, TeamEntry } from "../../model/entity/room-balance";

describe("CreateRoomHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...RoomProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get(CommandBus);
    ebus = module.get(EventBus);

    cbus.register([CreateRoomHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should create room ", async () => {
    const roomID = await cbus.execute(
      new CreateRoomCommand(
        new RoomBalance([
          new TeamEntry([
            new QueueEntryModel(
              "party1",
              MatchmakingMode.SOLOMID,
              Dota2Version.Dota_684,
              [new PlayerInQueueEntity(randomUser(), 100.0)],
            ),
          ]),
          new TeamEntry([
            new QueueEntryModel(
              "party2",
              MatchmakingMode.SOLOMID,
              Dota2Version.Dota_684,
              [new PlayerInQueueEntity(randomUser(), 100.0)],
            ),
          ]),
        ]),
        Dota2Version.Dota_684,
        MatchmakingMode.SOLOMID,
      ),
    );

    expect(ebus).toEmit(new RoomCreatedEvent(roomID));
  });
});
