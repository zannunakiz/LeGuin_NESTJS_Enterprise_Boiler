import { SeederOptions } from 'typeorm-extension';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export type DatabaseConfig = PostgresConnectionOptions & SeederOptions;
