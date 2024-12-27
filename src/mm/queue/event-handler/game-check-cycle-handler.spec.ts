import { randomUser } from "../../../@test/values";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { MatchmakingMode } from "../../../gateway/gateway/shared-types/matchmaking-mode";
import { QueueRepository } from "../repository/queue.repository";
import { QueueModel } from "../model/queue.model";
import { Dota2Version } from "../../../gateway/gateway/shared-types/dota2version";
import { QueueProviders } from "../index";
import { clearRepositories, TestEnvironment } from "../../../@test/cqrs";
import { EnterQueueHandler } from "../command/EnterQueue/enter-queue.handler";
import { GameCheckCycleHandler } from "./game-check-cycle.handler";
import { GameCheckCycleEvent } from "../event/game-check-cycle.event";
import { QueueEntryModel } from "../model/queue-entry.model";
import { PlayerInQueueEntity } from "../model/entity/player-in-queue.entity";
import { PlayerId } from "../../../gateway/gateway/shared-types/player-id";
import { GameFoundEvent } from "../event/game-found.event";

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

    await createTestQ(MatchmakingMode.UNRANKED);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should always find a match", () => {
    const qr = module.get(QueueRepository);
    const q = qr.get(
      QueueModel.id(MatchmakingMode.UNRANKED, Dota2Version.Dota_684),
    );
    expect(q).toBeDefined();

    const handler = module.get(GameCheckCycleHandler);
    expect(handler).toBeDefined();

    expect(ebus).toEmitNothing();
  });

  it("should find all possible games in 1 go", async () => {
    const qr = module.get(QueueRepository);
    await qr.save(
      QueueModel.id(MatchmakingMode.BOTS, Dota2Version.Dota_684),
      new QueueModel(MatchmakingMode.BOTS, Dota2Version.Dota_684),
    );
    const q = await qr.get(
      QueueModel.id(MatchmakingMode.BOTS, Dota2Version.Dota_684),
    );

    const handler = module.get(GameCheckCycleHandler);

    q.addEntry(
      new QueueEntryModel(
        "party1",
        MatchmakingMode.BOTS,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(new PlayerId("1234"), 1000)],
      ),
    );
    q.addEntry(
      new QueueEntryModel(
        "party2",
        MatchmakingMode.BOTS,
        Dota2Version.Dota_684,
        [
          new PlayerInQueueEntity(new PlayerId("12346"), 1000),
          new PlayerInQueueEntity(new PlayerId("44343"), 1000),
        ],
      ),
    );
    await handler.handle(
      new GameCheckCycleEvent(MatchmakingMode.BOTS, Dota2Version.Dota_684),
    );

    const mock = (ebus.publish as jest.Mock).mock;
    expect(
      mock.calls.filter((t) => t[0] instanceof GameFoundEvent),
    ).toHaveLength(2);
  });
});
