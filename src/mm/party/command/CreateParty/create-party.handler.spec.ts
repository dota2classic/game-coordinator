import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { clearRepositories } from "src/@test/clearRepository";
import { TestEnvironment } from "src/@test/cqrsMock";
import { CreatePartyHandler } from "src/mm/party/command/CreateParty/create-party.handler";
import { PartyProviders } from "src/mm/party";
import { CreatePartyCommand } from "src/mm/party/command/CreateParty/create-party.command";
import { PartyCreatedEvent } from "src/mm/party/event/party-created.event";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { PartyModel } from "src/mm/party/model/party.model";

describe("CreatePartyHandler", () => {
  let ebus: EventBus;
  let cbus: CommandBus;
  let rep: PartyRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...PartyProviders, ...TestEnvironment()],
    }).compile();

    cbus = module.get<CommandBus>(CommandBus);
    ebus = module.get<EventBus>(EventBus);

    rep = module.get<PartyRepository>(PartyRepository);
    cbus.register([CreatePartyHandler]);
  });

  afterEach(() => {
    clearRepositories();
  });

  it("new party", async () => {
    const partyId = await cbus.execute(new CreatePartyCommand("test"));
    expect(ebus).toEmit(new PartyCreatedEvent(partyId, "test"));
  });

  it("existing party", async () => {
    const party = new PartyModel("test", "test2", ["test2"]);
    await rep.save(party.id, party);

    await cbus.execute(new CreatePartyCommand("test2"));
    expect(ebus).toEmit();
  });
});
