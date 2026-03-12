import {
    AllowNull,
    BelongsTo,
    Column,
    DataType,
    Default,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import User from "./User";
import Message from "./Message";

@Table({
    underscored: true
})
export default class Conversation extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    id: string

    @ForeignKey(() => User)
    @AllowNull(false)
    @Column(DataType.UUID)
    participantOneId: string

    @ForeignKey(() => User)
    @AllowNull(false)
    @Column(DataType.UUID)
    participantTwoId: string

    @BelongsTo(() => User, "participantOneId")
    participantOne: User

    @BelongsTo(() => User, "participantTwoId")
    participantTwo: User

    @HasMany(() => Message, {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    })
    messages: Message[]
}
