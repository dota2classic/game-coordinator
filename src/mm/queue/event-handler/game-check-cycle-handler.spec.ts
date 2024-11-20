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
    const q = qr.get(QueueModel.id(MatchmakingMode.UNRANKED, Dota2Version.Dota_684));
    expect(q).toBeDefined()


    const handler = module.get(GameCheckCycleHandler)
    expect(handler).toBeDefined()

    expect(ebus).toEmitNothing();
  });
});
