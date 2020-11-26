import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus, EventPublisher } from "@nestjs/cqrs";
import { TestEnvironment, clearRepositories } from "src/@test/cqrs";
import {SetReadyCheckHandler} from "./set-ready-check.handler";
import {RoomProviders} from "../../index";
import {BalanceService} from "src/mm/queue/service/balance.service";


describe('SetReadyCheckHandler', () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ...RoomProviders,
        BalanceService,
        ...TestEnvironment()
      ],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);

    cbus.register([SetReadyCheckHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it('', async () => {

  });
});
