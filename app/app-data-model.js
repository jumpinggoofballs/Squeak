"use strict";
var Message = (function () {
    function Message(messageText, sourceIsMe) {
        this.messageText = messageText;
        this.sourceIsMe = sourceIsMe;
        this.messageStatus = 'Sending';
        this.messageTimeSent = new Date();
    }
    return Message;
}());
exports.Message = Message;
var Friend = (function () {
    function Friend(nickname) {
        this.nickname = nickname;
        this.unreadMessagesNumber = 0;
        this.timeLastMessage = new Date();
        this.lastMessagePreview = 'New Friend';
        this.messages = [];
    }
    return Friend;
}());
exports.Friend = Friend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLWRhdGEtbW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHAtZGF0YS1tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7SUFPSSxpQkFBWSxXQUFXLEVBQUUsVUFBVTtRQUMvQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztRQUMvQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUNMLGNBQUM7QUFBRCxDQUFDLEFBYkQsSUFhQztBQWJZLDBCQUFPO0FBZXBCO0lBT0ksZ0JBQVksUUFBZ0I7UUFDeEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFlBQVksQ0FBQztRQUN2QyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBQ0wsYUFBQztBQUFELENBQUMsQUFkRCxJQWNDO0FBZFksd0JBQU0iLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgTWVzc2FnZSB7XG4gICAgbWVzc2FnZVRleHQ6IHN0cmluZztcbiAgICBtZXNzYWdlVGltZVNlbnQ6IERhdGU7XG4gICAgbWVzc2FnZVRpbWVSZWNlaXZlZDogRGF0ZTtcbiAgICBtZXNzYWdlU3RhdHVzOiBzdHJpbmc7XG4gICAgc291cmNlSXNNZTogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2VUZXh0LCBzb3VyY2VJc01lKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZVRleHQgPSBtZXNzYWdlVGV4dDtcbiAgICAgICAgdGhpcy5zb3VyY2VJc01lID0gc291cmNlSXNNZTtcbiAgICAgICAgdGhpcy5tZXNzYWdlU3RhdHVzID0gJ1NlbmRpbmcnO1xuICAgICAgICB0aGlzLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRnJpZW5kIHtcbiAgICBuaWNrbmFtZTogc3RyaW5nO1xuICAgIHVucmVhZE1lc3NhZ2VzTnVtYmVyOiBudW1iZXI7XG4gICAgdGltZUxhc3RNZXNzYWdlOiBEYXRlO1xuICAgIGxhc3RNZXNzYWdlUHJldmlldzogc3RyaW5nO1xuICAgIG1lc3NhZ2VzOiBBcnJheTxNZXNzYWdlPjtcblxuICAgIGNvbnN0cnVjdG9yKG5pY2tuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgICAgICB0aGlzLnVucmVhZE1lc3NhZ2VzTnVtYmVyID0gMDtcbiAgICAgICAgdGhpcy50aW1lTGFzdE1lc3NhZ2UgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB0aGlzLmxhc3RNZXNzYWdlUHJldmlldyA9ICdOZXcgRnJpZW5kJztcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICAgIH1cbn0iXX0=