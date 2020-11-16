import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus, EventPublisher } from "@nestjs/cqrs";
import { TestEnvironment, clearRepositories } from "src/@test/cqrs";
import {SetReadyCheckHandler} from "./set-ready-check.handler";
import {RoomProviders} from "../../index";


describe('SetReadyCheckHandler', () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ...RoomProviders,
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
