import {Module} from "@nestjs/common";
import {MmModule} from "src/mm/mm.module";
import {GatewayModule} from "gateway/gateway.module";

@Module({
  imports: [
    MmModule,
    GatewayModule,

    // SentryModule.forRoot({
    //   dsn:
    //     "https://d225c9dd35e4487ebf086cd3579959d9@o435989.ingest.sentry.io/5529644",
    //   debug: false,
    //   environment: isDev ? "dev" : "production",
    //   logLevel: 2, //based on sentry.io loglevel //
    // }),
  ],
  providers: [],
})
export class AppModule {}
