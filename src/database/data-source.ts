import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getConfig as getDatabaseConfig } from './config/database.config';

export const AppDataSource = new DataSource(getDatabaseConfig());
