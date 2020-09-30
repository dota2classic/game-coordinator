import { PlayerRepository } from "src/mm/player/repository/player.repository";

const CommandHandlers = [];

export const PlayerProviders = [...CommandHandlers, PlayerRepository];
