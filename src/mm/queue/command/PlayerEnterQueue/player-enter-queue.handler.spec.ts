import {Test, TestingModule} from "@nestjs/testing";
import {CommandBus, EventBus, QueryBus} from "@nestjs/cqrs";
import {clearRepositories, mockQuery, TestEnvironment} from "src/@test/cqrs";
import {PlayerEnterQueueHandler} from "src/mm/queue/command/PlayerEnterQueue/player-enter-queue.handler";
import {PlayerEnterQueueCommand} from "src/gateway/gateway/commands/player-enter-queue.command";
import {MatchmakingMode} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {PlayerEnterQueueResolvedEvent} from "src/mm/queue/event/player-enter-queue-resolved.event";
import {QueueProviders} from "src/mm/queue";
import {PartyRepository} from "src/mm/party/repository/party.repository";
import {PartyCreatedEvent} from "src/mm/party/event/party-created.event";
import {randomUser} from "src/@test/values";
import {GetPlayerInfoQuery} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import {
  BanStatus,
  GetPlayerInfoQueryResult
} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import {BanReason} from "src/gateway/gateway/shared-types/ban";

describe("PlayerEnterQueueHandler", () => {
  let ebus: EventBus;
  let rep: PartyRepository;
  let cbus: CommandBus;
  let module: TestingModule;

  const q = mockQuery<GetPlayerInfoQuery, GetPlayerInfoQueryResult>(
    GetPlayerInfoQuery,
    t =>
      new GetPlayerInfoQueryResult(
        t.playerId,
        t.version,
        3000,
        0.5,
        {
          rankedGamesPlayed: 100,
          totalWinrate: 0.5,
          bestHeroes: [],
          rank: 5
        },
        new BanStatus(false, 0, BanReason.GAME_DECLINE),
      ),
  );

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...QueueProviders, PartyRepository, ...TestEnvironment(), q],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);
    const qbus = module.get<QueryBus>(QueryBus);
    rep = module.get<PartyRepository>(PartyRepository);

    cbus.register([PlayerEnterQueueHandler]);
    qbus.register([q]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should emit enter-queue", async () => {
    const u = randomUser();
    await cbus.execute(new PlayerEnterQueueCommand(u, MatchmakingMode.SOLOMID));
    const party = (await rep.all())[0];
    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, u, [u]),
      new PlayerEnterQueueResolvedEvent(
        party.id,
        party.players.map(t => ({
          playerId: t,
          mmr: 3000,
          recentWinrate: 0.5,
          gamesPlayed: 100,
        })),
        MatchmakingMode.SOLOMID,
      ),
    );
  });
});
