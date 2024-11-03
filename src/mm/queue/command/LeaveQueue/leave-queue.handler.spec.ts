import {Test, TestingModule} from "@nestjs/testing";
import {CommandBus, EventBus} from "@nestjs/cqrs";
import {clearRepositories, TestEnvironment} from "@test/cqrs";
import {LeaveQueueHandler} from "mm/queue/command/LeaveQueue/leave-queue.handler";
import {LeaveQueueCommand} from "mm/queue/command/LeaveQueue/leave-queue.command";
import {MatchmakingMode} from "gateway/gateway/shared-types/matchmaking-mode";
import {QueueRepository} from "mm/queue/repository/queue.repository";
import {QueueModel} from "mm/queue/model/queue.model";
import {QueueProviders} from "mm/queue";
import {QueueEntryModel} from "mm/queue/model/queue-entry.model";
import {PlayerInQueueEntity} from "mm/queue/model/entity/player-in-queue.entity";
import {QueueUpdatedEvent} from "gateway/gateway/events/queue-updated.event";
import {randomUser} from "@test/values";
import {Dota2Version} from "../../../../gateway/gateway/shared-types/dota2version";
import {BanStatus} from "../../../../gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";

describe("LeaveQueueHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  const createTestQ = async (mode: MatchmakingMode) => {
    const rep = module.get<QueueRepository>(QueueRepository);
    const q = new QueueModel(mode, Dota2Version.Dota_684);
    return rep.save(q.mode, q);
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);

    cbus.register([LeaveQueueHandler]);
    await createTestQ(MatchmakingMode.SOLOMID);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should not publish event if nothing removed", async () => {
    await cbus.execute(
      new LeaveQueueCommand(MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,"partyID"),
    );

    expect(ebus).toEmitNothing();
  });

  it("should publish event if party was in queue", async () => {
    // setup queue
    const a = await module
      .get<QueueRepository>(QueueRepository)
      .get(MatchmakingMode.SOLOMID);
    a.entries.push(
      new QueueEntryModel("partyID", MatchmakingMode.SOLOMID, [
        new PlayerInQueueEntity(randomUser(), 100, 0.5, 1000, 0, BanStatus.NOT_BANNED),
      ], 0,
        Dota2Version.Dota_684,),
    );

    await cbus.execute(
      new LeaveQueueCommand(,
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        "partyID",
      ),
    );

    expect(ebus).toEmit(new QueueUpdatedEvent(MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,));
  });
});
