import {Test, TestingModule} from "@nestjs/testing";
import {CommandBus, EventBus} from "@nestjs/cqrs";
import {clearRepositories, TestEnvironment} from "src/@test/cqrs";
import {RoomProviders} from "src/mm/room";
import {CreateRoomHandler} from "src/mm/room/command/CreateRoom/create-room.handler";
import {CreateRoomCommand, PartyInRoom,} from "src/mm/room/command/CreateRoom/create-room.command";
import {MatchmakingMode, RoomSizes} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {RoomImpossibleEvent} from "src/gateway/gateway/events/mm/room-impossible.event";
import {RoomCreatedEvent} from "src/mm/room/event/room-created.event";
import {randomUser} from "src/@test/values";
import {PlayerInQueueEntity} from "src/mm/queue/model/entity/player-in-queue.entity";

describe("CreateRoomHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...RoomProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);

    cbus.register([CreateRoomHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should not create room if it can't be balanced", async () => {
    const roomID = await cbus.execute(
      new CreateRoomCommand(
        MatchmakingMode.SOLOMID,
        RoomSizes[MatchmakingMode.SOLOMID],
        [
          new PartyInRoom(
            "partyID",
            [
              new PlayerInQueueEntity(
                randomUser(),
                1000,
                0.5,
                1000,
                undefined,
                0,
              ),
              new PlayerInQueueEntity(
                randomUser(),
                1000,
                0.5,
                1000,
                undefined,
                0,
              ),
            ]
          ),
        ],
      ),
    );

    expect(roomID).toBeUndefined();

    expect(ebus).toEmit(
      new RoomImpossibleEvent(MatchmakingMode.SOLOMID, ["partyID"]),
    );
  });

  it("should create room if it is possible to balance it", async () => {
    const roomID = await cbus.execute(
      new CreateRoomCommand(
        MatchmakingMode.SOLOMID,
        RoomSizes[MatchmakingMode.SOLOMID],
        [
          new PartyInRoom("partyID1", [
            new PlayerInQueueEntity(
              randomUser(),
              1000,
              0.5,
              1000,
              undefined,
              0,
            ),
          ]),
          new PartyInRoom("partyID2", [
            new PlayerInQueueEntity(
              randomUser(),
              1000,
              0.5,
              1000,
              undefined,
              0,
            ),
          ]),
        ],
      ),
    );

    expect(ebus).toEmit(new RoomCreatedEvent(roomID));
    expect(roomID).toBeDefined();
  });
});
