import { BelongsToMany, Column, HasMany } from "sequelize-typescript";
import { Default } from "sequelize-typescript";
import { Index } from "sequelize-typescript";
import { AllowNull } from "sequelize-typescript";
import { DataType } from "sequelize-typescript";
import { PrimaryKey } from "sequelize-typescript";
import { Model, Table } from "sequelize-typescript";
import Comment from "./Comment";
import Post from "./Post";
import Follow from "./Follow";

@Table({
    underscored: true
})
export default class User extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id: string

    @AllowNull(false)
    @Column(DataType.STRING(30))
    name: string

    @AllowNull(false)
    @Index({ unique: true })
    @Column(DataType.STRING)
    username: string

    @AllowNull(false)
    @Column(DataType.STRING)
    password: string

    @AllowNull(true)
    @Column({
        type: DataType.STRING,
        unique: true
    })
    email: string | null

    @AllowNull(true)
    @Column({
        type: DataType.STRING,
        unique: true
    })
    googleId: string | null

    @AllowNull(true)
    @Column(DataType.STRING)
    fullName: string | null

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    isPay: boolean

    @AllowNull(true)
    @Column(DataType.STRING)
    profilePicture: string | null

    @HasMany(() => Post, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    posts: Post[]

    @HasMany(() => Comment, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    comments: Comment[]

    @BelongsToMany(() => User, () => Follow, 'followeeId', 'followerId')
    followers: User[]

    @BelongsToMany(() => User, () => Follow, 'followerId', 'followeeId')
    following: User[]
}