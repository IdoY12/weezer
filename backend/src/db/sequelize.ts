import { Sequelize } from "sequelize-typescript";
import config from 'config'
import User from "../models/User";
import Post from "../models/Post";
import Comment from "../models/Comment";
import Follow from "../models/Follow";

const dbType = config.get<string>('dbType') || 'mysql';

let sequelizeConfig: any;

if (dbType === 'sqlite') {
    // SQLite configuration for local development
    sequelizeConfig = {
        dialect: 'sqlite',
        storage: './test-database.sqlite',
        models: [User, Post, Comment, Follow],
        logging: console.log
    };
} else {
    // Existing MySQL configuration (unchanged)
    sequelizeConfig = {
        ...config.get('db'),
        dialect: 'mysql',
        models: [User, Post, Comment, Follow],
        logging: console.log
    };
}

const sequelize = new Sequelize(sequelizeConfig)

export default sequelize