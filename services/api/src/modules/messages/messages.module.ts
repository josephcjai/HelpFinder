import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { ChatRoomEntity } from '../../entities/chat-room.entity';
import { MessageEntity } from '../../entities/message.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ChatRoomEntity, MessageEntity])],
    controllers: [MessagesController],
    providers: [MessagesService, MessagesGateway],
    exports: [MessagesService],
})
export class MessagesModule { }
