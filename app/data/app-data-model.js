"use strict";
var Message = (function () {
    function Message(messageText, sourceIsMe) {
        this.messageText = messageText;
        this.sourceIsMe = sourceIsMe;
        this.messageStatus = 'Sending';
    }
    return Message;
}());
exports.Message = Message;
var Friend = (function () {
    function Friend(nickname, firebaseId) {
        this.firebaseId = firebaseId;
        this.nickname = nickname;
        this.unreadMessagesNumber = 0;
        this.timeLastMessage = new Date();
        this.lastMessagePreview = 'New Friend';
        this.messages = [];
        this.documentType = 'Friend';
    }
    return Friend;
}());
exports.Friend = Friend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLWRhdGEtbW9kZWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHAtZGF0YS1tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7SUFPSSxpQkFBWSxXQUFXLEVBQUUsVUFBVTtRQUMvQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztJQUNuQyxDQUFDO0lBQ0wsY0FBQztBQUFELENBQUMsQUFaRCxJQVlDO0FBWlksMEJBQU87QUFjcEI7SUFTSSxnQkFBWSxRQUFnQixFQUFFLFVBQWtCO1FBQzVDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxZQUFZLENBQUM7UUFDdkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7SUFDakMsQ0FBQztJQUNMLGFBQUM7QUFBRCxDQUFDLEFBbEJELElBa0JDO0FBbEJZLHdCQUFNIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIE1lc3NhZ2Uge1xuICAgIG1lc3NhZ2VUZXh0OiBzdHJpbmc7XG4gICAgbWVzc2FnZVRpbWVTZW50OiBEYXRlO1xuICAgIG1lc3NhZ2VUaW1lUmVjZWl2ZWQ6IERhdGU7XG4gICAgbWVzc2FnZVN0YXR1czogc3RyaW5nO1xuICAgIHNvdXJjZUlzTWU6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlVGV4dCwgc291cmNlSXNNZSkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gbWVzc2FnZVRleHQ7XG4gICAgICAgIHRoaXMuc291cmNlSXNNZSA9IHNvdXJjZUlzTWU7XG4gICAgICAgIHRoaXMubWVzc2FnZVN0YXR1cyA9ICdTZW5kaW5nJztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGcmllbmQge1xuICAgIGZpcmViYXNlSWQ6IHN0cmluZztcbiAgICBuaWNrbmFtZTogc3RyaW5nO1xuICAgIHVucmVhZE1lc3NhZ2VzTnVtYmVyOiBudW1iZXI7XG4gICAgdGltZUxhc3RNZXNzYWdlOiBEYXRlO1xuICAgIGxhc3RNZXNzYWdlUHJldmlldzogc3RyaW5nO1xuICAgIG1lc3NhZ2VzOiBBcnJheTxNZXNzYWdlPjtcbiAgICBkb2N1bWVudFR5cGU6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKG5pY2tuYW1lOiBzdHJpbmcsIGZpcmViYXNlSWQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLmZpcmViYXNlSWQgPSBmaXJlYmFzZUlkO1xuICAgICAgICB0aGlzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgICAgIHRoaXMudW5yZWFkTWVzc2FnZXNOdW1iZXIgPSAwO1xuICAgICAgICB0aGlzLnRpbWVMYXN0TWVzc2FnZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHRoaXMubGFzdE1lc3NhZ2VQcmV2aWV3ID0gJ05ldyBGcmllbmQnO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW107XG4gICAgICAgIHRoaXMuZG9jdW1lbnRUeXBlID0gJ0ZyaWVuZCc7XG4gICAgfVxufSJdfQ==