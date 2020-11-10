import { Test, TestingModule } from "@nestjs/testing";
import { TestEnvironment } from "src/@test/cqrs";
import { QueueProviders } from "src/mm/queue";
import { QueueService } from "src/mm/queue/service/queue.service";
import { QueueModel } from "src/mm/queue/model/queue.model";
import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import {randomUser} from "src/@test/values";

describe("QueueService", () => {
  let qs: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    qs = module.get<QueueService>(QueueService);
  });

  it("should not find unranked game where not enough players", async () => {
    const qModel = new QueueModel(MatchmakingMode.SOLOMID);
    expect(qs.findGame(qModel)).toBeUndefined();
    qModel.addEntry(
      new QueueEntryModel("1", MatchmakingMode.SOLOMID, [
        new PlayerInQueueEntity(randomUser(), 1000),
      ]),
    );
    expect(qs.findGame(qModel)).toBeUndefined();
  });

  it("should find unranked game where there are only singles", async () => {
    const qModel = new QueueModel(MatchmakingMode.SOLOMID);
    qModel.addEntry(
      new QueueEntryModel("1", MatchmakingMode.SOLOMID, [
        new PlayerInQueueEntity(randomUser(), 1000),
      ]),
    );
    qModel.addEntry(
      new QueueEntryModel("2", MatchmakingMode.SOLOMID, [
        new PlayerInQueueEntity(randomUser(), 1000),
      ]),
    );
    expect(qs.findGame(qModel)).toBeDefined();
  });

  it("should find unranked game where there is party", async () => {
    const qModel = new QueueModel(MatchmakingMode.SOLOMID);
    qModel.addEntry(
      new QueueEntryModel("1", MatchmakingMode.SOLOMID, [
        new PlayerInQueueEntity(randomUser(), 1000),
        new PlayerInQueueEntity(randomUser(), 1000),
      ]),
    );
    expect(qs.findGame(qModel)).toBeDefined();
  });

  it("should not find unranked game when party size > room size", async () => {
    const qModel = new QueueModel(MatchmakingMode.SOLOMID);
    qModel.addEntry(
      new QueueEntryModel("1", MatchmakingMode.SOLOMID, [
        new PlayerInQueueEntity(randomUser(), 1000),
        new PlayerInQueueEntity(randomUser(), 1000),
        new PlayerInQueueEntity(randomUser(), 1000),
      ]),
    );
    expect(qs.findGame(qModel)).toBeUndefined();
  });
});
