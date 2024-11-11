import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories, TestEnvironment } from "@test/cqrs";
import { SetReadyCheckHandler } from "./set-ready-check.handler";
import { RoomProviders } from "../../index";
import { BalanceService } from "mm/queue/service/balance.service";

describe("SetReadyCheckHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [...RoomProviders, BalanceService, ...TestEnvironment()],
    }).compile();

    cbus = module.get(CommandBus);
    ebus = module.get(EventBus);

    cbus.register([SetReadyCheckHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("", async () => {});
});
