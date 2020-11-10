import {CommandHandler, EventBus, ICommandHandler, QueryBus,} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {PlayerEnterQueueCommand} from "src/gateway/gateway/commands/player-enter-queue.command";
import {PartyRepository} from "src/mm/party/repository/party.repository";
import {PlayerEnterQueueResolvedEvent} from "src/mm/queue/event/player-enter-queue-resolved.event";
import {GetPlayerInfoQuery} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";
import {GetPlayerInfoQueryResult} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";

@CommandHandler(PlayerEnterQueueCommand)
export class PlayerEnterQueueHandler
  implements ICommandHandler<PlayerEnterQueueCommand> {
  private readonly logger = new Logger(PlayerEnterQueueHandler.name);

  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
    private readonly qbus: QueryBus,
  ) {}

  async execute(command: PlayerEnterQueueCommand) {
    const p = await this.partyRepository.getPartyOf(command.playerID);

    const mmr = await this.qbus.execute<
      GetPlayerInfoQuery,
      GetPlayerInfoQueryResult
    >(new GetPlayerInfoQuery(command.playerID, Dota2Version.Dota_681));

    this.ebus.publish(
      new PlayerEnterQueueResolvedEvent(
        p.id,
        p.players.map(t => ({
          playerId: t,
          mmr: mmr.mmr,
        })),
        command.mode,
      ),
    );
  }
}