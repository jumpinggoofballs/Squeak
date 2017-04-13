export class Message {
    id: string;
    messageAuthor: string;
    messageText: string;
    messageTimeSent: Date;
    messageTimeReceived: Date;
    messageStatus: string;
    sourceIsMe: boolean;

    constructor(messageText, sourceIsMe) {
        this.messageText = messageText;
        this.sourceIsMe = sourceIsMe;
    }
}

export class Friend {
    firebaseId: string;
    nickname: string;
    unreadMessagesNumber: number;
    timeLastMessage: Date;
    lastMessagePreview: string;
    messages: Array<Message>;
    documentType: string;

    constructor(nickname: string) {
        this.nickname = nickname;
        this.unreadMessagesNumber = 0;
        this.timeLastMessage = new Date();
        this.messages = [];
        this.documentType = 'Friend';
    }
}