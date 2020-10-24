import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "src/@test/cqrs";
import { PlayerEnterQueueHandler } from "src/mm/queue/command/PlayerEnterQueue/player-enter-queue.handler";
import { PlayerEnterQueueCommand } from "src/gateway/gateway/commands/player-enter-queue.command";
import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { PlayerEnterQueueResolvedEvent } from "src/mm/queue/event/player-enter-queue-resolved.event";
import { QueueProviders } from "src/mm/queue";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { PartyCreatedEvent } from "src/mm/party/event/party-created.event";
import {PlayerId} from "src/gateway/gateway/shared-types/player-id";

describe("PlayerEnterQueueHandler", () => {
  let ebus: EventBus;
  let rep: PartyRepository;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...QueueProviders, PartyRepository, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);
    rep = module.get<PartyRepository>(PartyRepository);

    cbus.register([PlayerEnterQueueHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("should emit enter-queue", async () => {
    await cbus.execute(
      new PlayerEnterQueueCommand(new PlayerId("playerID"), MatchmakingMode.SOLOMID),
    );
    const party = (await rep.all())[0];
    expect(ebus).toEmit(
      new PartyCreatedEvent(party.id, new PlayerId("playerID")),
      new PlayerEnterQueueResolvedEvent(
        party.id,
        party.players.map(t => ({
          playerId: t,
          mmr: 3000,
        })),
        MatchmakingMode.SOLOMID,
      ),
    );
  });
});
