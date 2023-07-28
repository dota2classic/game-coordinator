import {CommandHandler, EventBus, ICommandHandler, QueryBus,} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {PlayerEnterQueueCommand} from "src/gateway/gateway/commands/player-enter-queue.command";
import {PartyRepository} from "src/mm/party/repository/party.repository";
import {PlayerEnterQueueResolvedEvent} from "src/mm/queue/event/player-enter-queue-resolved.event";
import {GetPlayerInfoQuery} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";
import {GetPlayerInfoQueryResult} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import {PlayerInQueueEntity} from "src/mm/queue/model/entity/player-in-queue.entity";

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

    const formattedEntries: PlayerInQueueEntity[] = await Promise.all(
      p.players.map(async t => {
        const mmr = await this.qbus.execute<
          GetPlayerInfoQuery,
          GetPlayerInfoQueryResult
        >(new GetPlayerInfoQuery(t, command.version));
        return {
          playerId: t,
          mmr: mmr.mmr,
          recentWinrate: mmr.recentWinrate,
          recentKDA: mmr.recentKDA,
          gamesPlayed: mmr.summary.rankedGamesPlayed,
          banStatus: mmr.banStatus,
          unrankedGamesLeft: mmr.summary.newbieGamesLeft,
        };
      }),
    );

    this.ebus.publish(
      new PlayerEnterQueueResolvedEvent(p.id, formattedEntries, command.mode, command.version),
    );
  }
}
