export class Message {
    messageText: string;
    messageAuthor: string;
    messageTimeSent: Date;
    messageTimeReceived: Date;
    messageStatus: string;
    sourceIsMe: boolean;

    constructor(messageText, sourceIsMe) {
        this.messageText = messageText;
        this.sourceIsMe = sourceIsMe;
        this.messageStatus = 'Sending';
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

    constructor(nickname: string, firebaseId: string) {
        this.firebaseId = firebaseId;
        this.nickname = nickname;
        this.unreadMessagesNumber = 0;
        this.timeLastMessage = new Date();
        this.lastMessagePreview = 'New Friend';
        this.messages = [];
        this.documentType = 'Friend';
    }
}