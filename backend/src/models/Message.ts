import {
    AllowNull,
    BelongsTo,
    Column,
    DataType,
    Default,
    ForeignKey,
    Model,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import Conversation from "./Conversation";
import User from "./User";

@Table({
    underscored: true
})
export default class Message extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id: string

    @ForeignKey(() => Conversation)
    @AllowNull(false)
    @Column(DataType.UUID)
    conversationId: string

    @ForeignKey(() => User)
    @AllowNull(false)
    @Column(DataType.UUID)
    senderId: string

    @AllowNull(false)
    @Column(DataType.TEXT)
    content: string

    @AllowNull(true)
    @Column(DataType.DATE)
    readAt: Date | null

    @BelongsTo(() => Conversation)
    conversation: Conversation

    @BelongsTo(() => User)
    sender: User
}
