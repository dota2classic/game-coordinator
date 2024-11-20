import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { EnterQueueHandler } from "mm/queue/command/EnterQueue/enter-queue.handler";
import { EnterQueueCommand } from "mm/queue/command/EnterQueue/enter-queue.command";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueUpdatedEvent } from "gateway/gateway/events/queue-updated.event";
import { QueueProviders } from "mm/queue";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueModel } from "mm/queue/model/queue.model";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import { randomUser } from "@test/values";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { GameCheckCycleHandler } from "mm/queue/event-handler/game-check-cycle.handler";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { Dota2Version } from "../../../../gateway/gateway/shared-types/dota2version";
import { BanStatus } from "../../../../gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import {
  RoomBalance,
  TeamEntry,
} from "../../../room/model/entity/room-balance";
import { BalanceService } from "../../service/balance.service";

const u1 = randomUser();
const u2 = randomUser();
describe("EnterQueueHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;

  let module: TestingModule;

  const createTestQ = async (mode: MatchmakingMode) => {
    const rep = module.get<QueueRepository>(QueueRepository);
    const q = new QueueModel(mode, Dota2Version.Dota_684);
    return rep.save(q.compId, q);
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get(CommandBus);
    ebus = module.get(EventBus);
    cbus.register([EnterQueueHandler]);

    await createTestQ(MatchmakingMode.SOLOMID);
    await createTestQ(MatchmakingMode.RANKED);
    await createTestQ(MatchmakingMode.UNRANKED);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should not enter queue if there is no queue", async () => {
    // remove all queues
    clearRepositories();
    const queueEntryId = await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
      ),
    );
    expect(queueEntryId).toBeUndefined();
    expect(ebus).toEmitNothing();
  });

  it("should enter queue", async () => {
    const mode = MatchmakingMode.SOLOMID;

    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
        mode,
        Dota2Version.Dota_684,
      ),
    );
    expect(ebus).toEmit(new QueueUpdatedEvent(mode, Dota2Version.Dota_684));
  });

  // Skip because: not implemented yet
  it.skip("Should find game", async () => {
    const mode = MatchmakingMode.SOLOMID;
    const version = Dota2Version.Dota_684;

    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [
          new PlayerInQueueEntity(u1, 1000, BanStatus.NOT_BANNED),
          new PlayerInQueueEntity(u2, 1000, BanStatus.NOT_BANNED),
        ],
        mode,
        version,
      ),
    );

    expect(ebus).toEmit(
      new QueueUpdatedEvent(mode, version), // add first
      new QueueUpdatedEvent(mode, version), // clear
      new GameFoundEvent(
        new RoomBalance([
          new TeamEntry([
            new QueueEntryModel("party", mode, version, [
              new PlayerInQueueEntity(u1, 1000, BanStatus.NOT_BANNED),
            ]),
          ]),
          new TeamEntry([
            new QueueEntryModel("party", mode, version, [
              new PlayerInQueueEntity(u2, 1000, BanStatus.NOT_BANNED),
            ]),
          ]),
        ]),
        version,
        mode,
      ),
    );
  });

  it("should handle duplicate enter queue", async () => {
    const mode = MatchmakingMode.SOLOMID;
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
        mode,
        Dota2Version.Dota_684,
      ),
    );
    // reset publishes
    ebus.publish = jest.fn();
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
        mode,
        Dota2Version.Dota_684,
      ),
    );
    expect(ebus).toEmitNothing();
  });

  it("should keep party in one queue only at a time", async () => {
    // enter ranked queue
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
        MatchmakingMode.RANKED,
        Dota2Version.Dota_684,
      ),
    );

    // enter solomid queue after
    await cbus.execute(
      new EnterQueueCommand(
        "party",
        [new PlayerInQueueEntity(u1, 100)],
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
      ),
    );

    expect(ebus).toEmit(
      new QueueUpdatedEvent(MatchmakingMode.RANKED, Dota2Version.Dota_684), // enter ranked queue
      new QueueUpdatedEvent(MatchmakingMode.RANKED, Dota2Version.Dota_684), // leave ranked queue
      new QueueUpdatedEvent(MatchmakingMode.SOLOMID, Dota2Version.Dota_684), // enter solomid
    );
  });
});
