import * as Joi from 'joi';
import { AppConfig } from './app.config';

export interface ConfigType {
  app: AppConfig;
}

export const appConfigSchema = Joi.object({
  APP_MESSAGE_PREFIX: Joi.string().default('Hello'),
});
