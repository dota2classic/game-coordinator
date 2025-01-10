import { Module } from "@nestjs/common";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { ConfigService } from "@nestjs/config";
import { MetricsProviders } from "./index";

@Module({
  imports: [
    PrometheusModule.registerAsync({
      useFactory(config: ConfigService) {
        return {
          pushgateway: {
            url: config.get("pushgateway_url"),
          },
        };
      },
      global: true,
      imports: [],
      inject: [ConfigService],
    }),
  ],
  providers: [...MetricsProviders],
})
export class MetricsModule {}
