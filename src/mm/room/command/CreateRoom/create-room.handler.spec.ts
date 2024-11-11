import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { RoomProviders } from "mm/room";
import { CreateRoomHandler } from "mm/room/command/CreateRoom/create-room.handler";
import {
  CreateRoomCommand,
  PartyInRoom,
} from "mm/room/command/CreateRoom/create-room.command";
import {
  MatchmakingMode,
  RoomSizes,
} from "gateway/gateway/shared-types/matchmaking-mode";
import { RoomImpossibleEvent } from "gateway/gateway/events/mm/room-impossible.event";
import { RoomCreatedEvent } from "mm/room/event/room-created.event";
import { randomUser } from "@test/values";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { Dota2Version } from "../../../../gateway/gateway/shared-types/dota2version";
import { BalanceService } from "../../../queue/service/balance.service";
import { QueueEntryModel } from "../../../queue/model/queue-entry.model";

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
        BalanceService.soloMidBalance(RoomSizes[MatchmakingMode.SOLOMID], [
          new QueueEntryModel(
            "party1",
            MatchmakingMode.SOLOMID,
            Dota2Version.Dota_684,
            [new PlayerInQueueEntity(randomUser(), 100.0)],
          ),
          new QueueEntryModel(
            "party2",
            MatchmakingMode.SOLOMID,
            Dota2Version.Dota_684,
            [new PlayerInQueueEntity(randomUser(), 100.0)],
          )
        ]),
        Dota2Version.Dota_684,
        MatchmakingMode.SOLOMID,
      ),
    );

    expect(ebus).toEmit(new RoomCreatedEvent(roomID));

  });
});
