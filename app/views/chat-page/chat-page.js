"use strict";
var observable_1 = require("data/observable");
var dialogs = require("ui/dialogs");
var timer = require("timer");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
        _this.listViewRef = _this.pageRef.getViewById('messagesList');
        _this.newMessageText = '';
        _this.getPageData();
        _this.scrollMessagesList();
        pageRef.on('newMessageReceived', function () {
            _this.getPageData();
            _this.reScrollWithDelay();
        });
        return _this;
    }
    PageModel.prototype.getPageData = function () {
        var friendRef = this.pageRef.navigationContext.chatRef;
        var thisChatFriend = appStore.getFriend(friendRef);
        this.set('thisFriend', thisChatFriend);
        // then mark all messages as read (locally)
        thisChatFriend.unreadMessagesNumber = 0;
        appStore.updateFriend(friendRef, thisChatFriend);
    };
    PageModel.prototype.reScrollWithDelay = function () {
        var _this = this;
        timer.setTimeout(function () {
            _this.scrollMessagesList('animate');
        }, 800);
    };
    PageModel.prototype.goBack = function () {
        app_navigation_1.navigateBack();
    };
    PageModel.prototype.scrollMessagesList = function (animate) {
        if (this.listViewRef.android && (animate === 'animate')) {
            this.listViewRef.android.smoothScrollToPosition(this.thisFriend.messages.length - 1);
        }
        else {
            this.listViewRef.scrollToIndex(this.thisFriend.messages.length - 1);
        }
    };
    PageModel.prototype.sendMessage = function () {
        var _this = this;
        if (this.newMessageText) {
            appStore.sendMessage(this.thisFriend._id, this.newMessageText)
                .then(function () {
                _this.set('newMessageText', '');
                _this.getPageData();
                _this.reScrollWithDelay();
                _this.pageRef.getViewById('newMessageInput').dismissSoftInput();
            });
        }
    };
    PageModel.prototype.clearMessages = function () {
        var _this = this;
        dialogs.confirm({
            title: 'Clear Message History?',
            okButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then(function (result) {
            // result argument is boolean
            if (result) {
                _this.thisFriend.messages = [];
                appStore.updateFriend(_this.thisFriend._id, _this.thisFriend);
                _this.getPageData();
            }
        });
    };
    PageModel.prototype.removeFriend = function () {
        var _this = this;
        dialogs.confirm({
            title: 'Delete Friend',
            message: 'Are you sure you want to delete all records of ' + this.thisFriend.nickname + ' and block them from sending you messages?',
            okButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then(function (result) {
            // result argument is boolean
            if (result) {
                appStore.removeFriend(_this.thisFriend._id).then(function () { return app_navigation_1.navigateBack(); });
            }
        });
    };
    PageModel.prototype.editFriend = function () {
        app_navigation_1.navigateTo('profile-page', this.thisFriend._id);
    };
    // not implemented    
    PageModel.prototype.onMessageTap = function (args) {
        var thisMessage = this.thisFriend.messages[args.index];
        var author = thisMessage.sourceIsMe ? 'Me' : this.thisFriend.nickname;
        var timeSent = new Date(thisMessage.messageTimeSent).toUTCString();
        var status = thisMessage.status;
        var timeReceived;
        if (thisMessage.messageTimeReceived) {
            timeReceived = new Date(thisMessage.messageTimeReceived).toUTCString();
        }
        else {
            timeReceived = 'n/a';
        }
        var thisMessageString = ('Author: ' + author +
            '\n\nTime Sent: ' + timeSent +
            '\n\nTime Received: ' + timeReceived +
            '\n\nStatus: ' + thisMessage.messageStatus);
        dialogs.alert({
            title: 'Message Details',
            message: thisMessageString,
            okButtonText: 'Done'
        });
    };
    return PageModel;
}(observable_1.Observable));
// Mount the Page Model onto the xml View
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel(page);
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFHeEQsb0NBQXFDO0FBQ3JDLDZCQUErQjtBQUUvQiwrQ0FBaUQ7QUFDakQsdURBQWdFO0FBRWhFO0lBQXdCLDZCQUFVO0lBTzlCLG1CQUFZLE9BQVk7UUFBeEIsWUFDSSxpQkFBTyxTQVdWO1FBVkcsS0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsS0FBSSxDQUFDLFdBQVcsR0FBYSxLQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN0RSxLQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsS0FBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFMUIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsS0FBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQUVPLCtCQUFXLEdBQW5CO1FBQ0ksSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7UUFDdkQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUV2QywyQ0FBMkM7UUFDM0MsY0FBYyxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQztRQUN4QyxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRU0scUNBQWlCLEdBQXhCO1FBQUEsaUJBSUM7UUFIRyxLQUFL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SUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBSEQsZ0NBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEsIE9ic2VydmFibGUgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tICd1aS9kaWFsb2dzJ1xuaW1wb3J0ICogYXMgdGltZXIgZnJvbSAndGltZXInO1xuXG5pbXBvcnQgKiBhcyBhcHBTdG9yZSBmcm9tICcuLi8uLi9kYXRhL2FwcC1zdG9yZSc7XG5pbXBvcnQgeyBuYXZpZ2F0ZUJhY2ssIG5hdmlnYXRlVG8gfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHJpdmF0ZSB0aGlzRnJpZW5kOiBhbnk7XG4gICAgcHJpdmF0ZSBwYWdlUmVmOiBhbnk7XG4gICAgcHJpdmF0ZSBsaXN0Vmlld1JlZjogYW55O1xuICAgIHB1YmxpYyBuZXdNZXNzYWdlVGV4dDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocGFnZVJlZjogYW55KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFnZVJlZiA9IHBhZ2VSZWY7XG4gICAgICAgIHRoaXMubGlzdFZpZXdSZWYgPSA8TGlzdFZpZXc+dGhpcy5wYWdlUmVmLmdldFZpZXdCeUlkKCdtZXNzYWdlc0xpc3QnKTtcbiAgICAgICAgdGhpcy5uZXdNZXNzYWdlVGV4dCA9ICcnO1xuICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsTWVzc2FnZXNMaXN0KCk7XG5cbiAgICAgICAgcGFnZVJlZi5vbignbmV3TWVzc2FnZVJlY2VpdmVkJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICAgICAgdGhpcy5yZVNjcm9sbFdpdGhEZWxheSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFBhZ2VEYXRhKCkge1xuICAgICAgICB2YXIgZnJpZW5kUmVmID0gdGhpcy5wYWdlUmVmLm5hdmlnYXRpb25Db250ZXh0LmNoYXRSZWY7XG4gICAgICAgIHZhciB0aGlzQ2hhdEZyaWVuZCA9IGFwcFN0b3JlLmdldEZyaWVuZChmcmllbmRSZWYpO1xuICAgICAgICB0aGlzLnNldCgndGhpc0ZyaWVuZCcsIHRoaXNDaGF0RnJpZW5kKTtcblxuICAgICAgICAvLyB0aGVuIG1hcmsgYWxsIG1lc3NhZ2VzIGFzIHJlYWQgKGxvY2FsbHkpXG4gICAgICAgIHRoaXNDaGF0RnJpZW5kLnVucmVhZE1lc3NhZ2VzTnVtYmVyID0gMDtcbiAgICAgICAgYXBwU3RvcmUudXBkYXRlRnJpZW5kKGZyaWVuZFJlZiwgdGhpc0NoYXRGcmllbmQpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZVNjcm9sbFdpdGhEZWxheSgpIHtcbiAgICAgICAgdGltZXIuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbE1lc3NhZ2VzTGlzdCgnYW5pbWF0ZScpO1xuICAgICAgICB9LCA4MDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb0JhY2soKSB7XG4gICAgICAgIG5hdmlnYXRlQmFjaygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzY3JvbGxNZXNzYWdlc0xpc3QoYW5pbWF0ZT86IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5saXN0Vmlld1JlZi5hbmRyb2lkICYmIChhbmltYXRlID09PSAnYW5pbWF0ZScpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RWaWV3UmVmLmFuZHJvaWQuc21vb3RoU2Nyb2xsVG9Qb3NpdGlvbih0aGlzLnRoaXNGcmllbmQubWVzc2FnZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RWaWV3UmVmLnNjcm9sbFRvSW5kZXgodGhpcy50aGlzRnJpZW5kLm1lc3NhZ2VzLmxlbmd0aCAtIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNlbmRNZXNzYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5uZXdNZXNzYWdlVGV4dCkge1xuICAgICAgICAgICAgYXBwU3RvcmUuc2VuZE1lc3NhZ2UodGhpcy50aGlzRnJpZW5kLl9pZCwgdGhpcy5uZXdNZXNzYWdlVGV4dClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCduZXdNZXNzYWdlVGV4dCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlU2Nyb2xsV2l0aERlbGF5KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFnZVJlZi5nZXRWaWV3QnlJZCgnbmV3TWVzc2FnZUlucHV0JykuZGlzbWlzc1NvZnRJbnB1dCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFyTWVzc2FnZXMoKSB7XG4gICAgICAgIGRpYWxvZ3MuY29uZmlybSh7XG4gICAgICAgICAgICB0aXRsZTogJ0NsZWFyIE1lc3NhZ2UgSGlzdG9yeT8nLFxuICAgICAgICAgICAgb2tCdXR0b25UZXh0OiAnWWVzJyxcbiAgICAgICAgICAgIGNhbmNlbEJ1dHRvblRleHQ6ICdObydcbiAgICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgLy8gcmVzdWx0IGFyZ3VtZW50IGlzIGJvb2xlYW5cbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRoaXNGcmllbmQubWVzc2FnZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBhcHBTdG9yZS51cGRhdGVGcmllbmQodGhpcy50aGlzRnJpZW5kLl9pZCwgdGhpcy50aGlzRnJpZW5kKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVGcmllbmQoKSB7XG4gICAgICAgIGRpYWxvZ3MuY29uZmlybSh7XG4gICAgICAgICAgICB0aXRsZTogJ0RlbGV0ZSBGcmllbmQnLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgYWxsIHJlY29yZHMgb2YgJyArIHRoaXMudGhpc0ZyaWVuZC5uaWNrbmFtZSArICcgYW5kIGJsb2NrIHRoZW0gZnJvbSBzZW5kaW5nIHlvdSBtZXNzYWdlcz8nLFxuICAgICAgICAgICAgb2tCdXR0b25UZXh0OiAnWWVzJyxcbiAgICAgICAgICAgIGNhbmNlbEJ1dHRvblRleHQ6ICdObydcbiAgICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgLy8gcmVzdWx0IGFyZ3VtZW50IGlzIGJvb2xlYW5cbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBhcHBTdG9yZS5yZW1vdmVGcmllbmQodGhpcy50aGlzRnJpZW5kLl9pZCkudGhlbigoKSA9PiBuYXZpZ2F0ZUJhY2soKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBlZGl0RnJpZW5kKCkge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdwcm9maWxlLXBhZ2UnLCB0aGlzLnRoaXNGcmllbmQuX2lkKTtcbiAgICB9XG5cbiAgICAvLyBub3QgaW1wbGVtZW50ZWQgICAgXG4gICAgcHVibGljIG9uTWVzc2FnZVRhcChhcmdzKSB7XG4gICAgICAgIHZhciB0aGlzTWVzc2FnZSA9IHRoaXMudGhpc0ZyaWVuZC5tZXNzYWdlc1thcmdzLmluZGV4XTtcblxuICAgICAgICB2YXIgYXV0aG9yID0gdGhpc01lc3NhZ2Uuc291cmNlSXNNZSA/ICdNZScgOiB0aGlzLnRoaXNGcmllbmQubmlja25hbWU7XG4gICAgICAgIHZhciB0aW1lU2VudCA9IG5ldyBEYXRlKHRoaXNNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCkudG9VVENTdHJpbmcoKTtcbiAgICAgICAgdmFyIHN0YXR1cyA9IHRoaXNNZXNzYWdlLnN0YXR1cztcblxuICAgICAgICB2YXIgdGltZVJlY2VpdmVkO1xuICAgICAgICBpZiAodGhpc01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZCkge1xuICAgICAgICAgICAgdGltZVJlY2VpdmVkID0gbmV3IERhdGUodGhpc01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZCkudG9VVENTdHJpbmcoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRpbWVSZWNlaXZlZCA9ICduL2EnO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRoaXNNZXNzYWdlU3RyaW5nID1cbiAgICAgICAgICAgICgnQXV0aG9yOiAnICsgYXV0aG9yICtcbiAgICAgICAgICAgICAgICAnXFxuXFxuVGltZSBTZW50OiAnICsgdGltZVNlbnQgK1xuICAgICAgICAgICAgICAgICdcXG5cXG5UaW1lIFJlY2VpdmVkOiAnICsgdGltZVJlY2VpdmVkICtcbiAgICAgICAgICAgICAgICAnXFxuXFxuU3RhdHVzOiAnICsgdGhpc01lc3NhZ2UubWVzc2FnZVN0YXR1cyk7XG4gICAgICAgIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICAgICAgdGl0bGU6ICdNZXNzYWdlIERldGFpbHMnLFxuICAgICAgICAgICAgbWVzc2FnZTogdGhpc01lc3NhZ2VTdHJpbmcsXG4gICAgICAgICAgICBva0J1dHRvblRleHQ6ICdEb25lJ1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbi8vIE1vdW50IHRoZSBQYWdlIE1vZGVsIG9udG8gdGhlIHhtbCBWaWV3XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKHBhZ2UpO1xufSJdfQ==