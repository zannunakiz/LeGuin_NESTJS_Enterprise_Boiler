import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getSeedConfig } from './config/database.config';

const dataSource = new DataSource(getSeedConfig());

export default dataSource;
