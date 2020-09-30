import { PartyRepository } from "src/mm/party/repository/party.repository";
import { CreatePartyHandler } from "src/mm/party/command/CreateParty/create-party.handler";

const CommandHandlers = [
  CreatePartyHandler
];

export const PartyProviders = [
  ...CommandHandlers,
  PartyRepository
];
