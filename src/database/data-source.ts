import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getConfig } from './config/database.config';

export const AppDataSource = new DataSource(getConfig());
