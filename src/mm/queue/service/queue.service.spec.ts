import { Test, TestingModule } from "@nestjs/testing";
import { TestEnvironment } from "@test/cqrs";
import { QueueProviders } from "mm/queue";
import { QueueService } from "mm/queue/service/queue.service";
import { QueueModel } from "mm/queue/model/queue.model";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { randomUser } from "@test/values";
import { BanStatus } from "../../../gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import { Dota2Version } from "../../../gateway/gateway/shared-types/dota2version";

describe("QueueService", () => {
  let qs: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...QueueProviders, ...TestEnvironment()],
    }).compile();

    qs = module.get(QueueService);
  });

  it("should not find unranked game where not enough players", async () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );
    expect(qs.findGame(qModel)).toBeUndefined();
    qModel.addEntry(
      new QueueEntryModel(
        "1",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 100)],
        0,
      ),
    );
    expect(qs.findGame(qModel)).toBeUndefined();
  });

  it("should find unranked game where there are only singles", async () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );
    qModel.addEntry(
      new QueueEntryModel(
        "1",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 100)],
        0,
      ),
    );
    qModel.addEntry(
      new QueueEntryModel(
        "2",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [new PlayerInQueueEntity(randomUser(), 100)],
        0,
      ),
    );
    expect(qs.findGame(qModel)).toBeDefined();
  });

  it("should find unranked game where there is party", async () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );
    qModel.addEntry(
      new QueueEntryModel(
        "1",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
        ],
        0,
      ),
    );
    expect(qs.findGame(qModel)).toBeDefined();
  });

  it("should not find unranked game when party size > room size", async () => {
    const qModel = new QueueModel(
      MatchmakingMode.SOLOMID,
      Dota2Version.Dota_684,
    );
    qModel.addEntry(
      new QueueEntryModel(
        "1",
        MatchmakingMode.SOLOMID,
        Dota2Version.Dota_684,
        [
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
          new PlayerInQueueEntity(randomUser(), 100),
        ],
        0,
      ),
    );
    expect(qs.findGame(qModel)).toBeUndefined();
  });

  it("should find ranked game when cycle", () => {
    // const qModel = new QueueModel(MatchmakingMode.RANKED);
    // qModel.addEntry(
    //   new QueueEntryModel("1", MatchmakingMode.SOLOMID, [
    //     new PlayerInQueueEntity(randomUser(), 1000, 0.5, 100, undefined, BanStatus.NOT_BANNED),
    //     new PlayerInQueueEntity(randomUser(), 1000, 0.5, 100, undefined, BanStatus.NOT_BANNED),
    //     new PlayerInQueueEntity(randomUser(), 1000, 0.5, 100, undefined, BanStatus.NOT_BANNED),
    //   ]),
    // );
    // expect(qs.findGame(qModel)).toBeUndefined();
  });
});
