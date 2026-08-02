import { registerAs } from '@nestjs/config';

export interface AppConfig {
  messagePrefix: string;
  port: number;
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    messagePrefix: process.env.APP_MESSAGE_PREFIX ?? 'Hello',
    port: parseInt(process.env.PORT ?? '3000', 10),
  }),
);
