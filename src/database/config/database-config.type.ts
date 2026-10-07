import { DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

export type DatabaseConfig = DataSourceOptions & SeederOptions;
