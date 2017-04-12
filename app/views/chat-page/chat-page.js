"use strict";
var observable_1 = require("data/observable");
var timer = require("timer");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
// import { cancelNotification } from '../../data/notification';
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
        _this.newMessageText = '';
        _this.getPageData();
        _this.scrollMessagesList();
        pageRef.on('newMessageReceived', function (args) {
            _this.getPageData();
            _this.reScrollWithDelay();
            // cancelNotification(args.object);         // also cancels when the app is minimised
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
        var listViewRef = this.pageRef.getViewById('messagesList');
        if (listViewRef.android && (animate === 'animate')) {
            listViewRef.android.smoothScrollToPosition(this.thisFriend.messages.length - 1);
        }
        else {
            listViewRef.scrollToIndex(this.thisFriend.messages.length - 1);
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
    PageModel.prototype.removeFriend = function () {
        app_navigation_1.navigateBack();
        appStore.removeFriend(this.thisFriend._id);
    };
    return PageModel;
}(observable_1.Observable));
// Mount the Page Model onto the xml View
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel(page);
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFHeEQsNkJBQStCO0FBRS9CLCtDQUFpRDtBQUNqRCx1REFBb0Q7QUFDcEQsZ0VBQWdFO0FBRWhFO0lBQXdCLDZCQUFVO0lBTTlCLG1CQUFZLE9BQVk7UUFBeEIsWUFDSSxpQkFBTyxTQVdWO1FBVkcsS0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsS0FBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7UUFDekIsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25CLEtBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBRTFCLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsVUFBQSxJQUFJO1lBQ2pDLEtBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixLQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN6QixxRkFBcUY7UUFDekYsQ0FBQyxDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQUVPLCtCQUFXLEdBQW5CO1FBQ0ksSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7UUFDdkQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUV2QywyQ0FBMkM7UUFDM0MsY0FBYyxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQztRQUN4QyxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRU0scUNBQWlCLEdBQXhCO1FBQUEsaUJBSUM7UUFIRyxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQ2IsS0FBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFTSwwQkFBTSxHQUFiO1FBQ0ksNkJBQVksRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFTSxzQ0FBa0IsR0FBekIsVUFBMEIsT0FBZ0I7UUFDdEMsSUFBSSxXQUFXLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDckUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsV0FBVyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztJQUNMLENBQUM7SUFFTSwrQkFBVyxHQUFsQjtRQUFBLGlCQVVDO1FBVEcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDO2lCQUN6RCxJQUFJLENBQUM7Z0JBQ0YsS0FBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDL0IsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNuQixLQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDekIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ25FLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztJQUNMLENBQUM7SUFFTSxnQ0FBWSxHQUFuQjtRQUNJLDZCQUFZLEVBQUUsQ0FBQztRQUNmLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBakVELENBQXdCLHVCQUFVLEdBaUVqQztBQUVELHlDQUF5QztBQUN6QyxvQkFBMkIsSUFBZTtJQUN0QyxJQUFJLElBQUksR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUhELGdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnREYXRhLCBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IExpc3RWaWV3IH0gZnJvbSAndWkvbGlzdC12aWV3JztcbmltcG9ydCAqIGFzIHRpbWVyIGZyb20gJ3RpbWVyJztcblxuaW1wb3J0ICogYXMgYXBwU3RvcmUgZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuaW1wb3J0IHsgbmF2aWdhdGVCYWNrIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuLy8gaW1wb3J0IHsgY2FuY2VsTm90aWZpY2F0aW9uIH0gZnJvbSAnLi4vLi4vZGF0YS9ub3RpZmljYXRpb24nO1xuXG5jbGFzcyBQYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgdGhpc0ZyaWVuZDogYW55O1xuICAgIHByaXZhdGUgcGFnZVJlZjogYW55O1xuICAgIHB1YmxpYyBuZXdNZXNzYWdlVGV4dDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocGFnZVJlZjogYW55KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFnZVJlZiA9IHBhZ2VSZWY7XG4gICAgICAgIHRoaXMubmV3TWVzc2FnZVRleHQgPSAnJztcbiAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICB0aGlzLnNjcm9sbE1lc3NhZ2VzTGlzdCgpO1xuXG4gICAgICAgIHBhZ2VSZWYub24oJ25ld01lc3NhZ2VSZWNlaXZlZCcsIGFyZ3MgPT4ge1xuICAgICAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICAgICAgdGhpcy5yZVNjcm9sbFdpdGhEZWxheSgpO1xuICAgICAgICAgICAgLy8gY2FuY2VsTm90aWZpY2F0aW9uKGFyZ3Mub2JqZWN0KTsgICAgICAgICAvLyBhbHNvIGNhbmNlbHMgd2hlbiB0aGUgYXBwIGlzIG1pbmltaXNlZFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFBhZ2VEYXRhKCkge1xuICAgICAgICB2YXIgZnJpZW5kUmVmID0gdGhpcy5wYWdlUmVmLm5hdmlnYXRpb25Db250ZXh0LmNoYXRSZWY7XG4gICAgICAgIHZhciB0aGlzQ2hhdEZyaWVuZCA9IGFwcFN0b3JlLmdldEZyaWVuZChmcmllbmRSZWYpO1xuICAgICAgICB0aGlzLnNldCgndGhpc0ZyaWVuZCcsIHRoaXNDaGF0RnJpZW5kKTtcblxuICAgICAgICAvLyB0aGVuIG1hcmsgYWxsIG1lc3NhZ2VzIGFzIHJlYWQgKGxvY2FsbHkpXG4gICAgICAgIHRoaXNDaGF0RnJpZW5kLnVucmVhZE1lc3NhZ2VzTnVtYmVyID0gMDtcbiAgICAgICAgYXBwU3RvcmUudXBkYXRlRnJpZW5kKGZyaWVuZFJlZiwgdGhpc0NoYXRGcmllbmQpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZVNjcm9sbFdpdGhEZWxheSgpIHtcbiAgICAgICAgdGltZXIuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbE1lc3NhZ2VzTGlzdCgnYW5pbWF0ZScpO1xuICAgICAgICB9LCA4MDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb0JhY2soKSB7XG4gICAgICAgIG5hdmlnYXRlQmFjaygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzY3JvbGxNZXNzYWdlc0xpc3QoYW5pbWF0ZT86IHN0cmluZykge1xuICAgICAgICB2YXIgbGlzdFZpZXdSZWYgPSA8TGlzdFZpZXc+dGhpcy5wYWdlUmVmLmdldFZpZXdCeUlkKCdtZXNzYWdlc0xpc3QnKTtcbiAgICAgICAgaWYgKGxpc3RWaWV3UmVmLmFuZHJvaWQgJiYgKGFuaW1hdGUgPT09ICdhbmltYXRlJykpIHtcbiAgICAgICAgICAgIGxpc3RWaWV3UmVmLmFuZHJvaWQuc21vb3RoU2Nyb2xsVG9Qb3NpdGlvbih0aGlzLnRoaXNGcmllbmQubWVzc2FnZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaXN0Vmlld1JlZi5zY3JvbGxUb0luZGV4KHRoaXMudGhpc0ZyaWVuZC5tZXNzYWdlcy5sZW5ndGggLSAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzZW5kTWVzc2FnZSgpIHtcbiAgICAgICAgaWYgKHRoaXMubmV3TWVzc2FnZVRleHQpIHtcbiAgICAgICAgICAgIGFwcFN0b3JlLnNlbmRNZXNzYWdlKHRoaXMudGhpc0ZyaWVuZC5faWQsIHRoaXMubmV3TWVzc2FnZVRleHQpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCgnbmV3TWVzc2FnZVRleHQnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0UGFnZURhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZVNjcm9sbFdpdGhEZWxheSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhZ2VSZWYuZ2V0Vmlld0J5SWQoJ25ld01lc3NhZ2VJbnB1dCcpLmRpc21pc3NTb2Z0SW5wdXQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVGcmllbmQoKSB7XG4gICAgICAgIG5hdmlnYXRlQmFjaygpO1xuICAgICAgICBhcHBTdG9yZS5yZW1vdmVGcmllbmQodGhpcy50aGlzRnJpZW5kLl9pZCk7XG4gICAgfVxufVxuXG4vLyBNb3VudCB0aGUgUGFnZSBNb2RlbCBvbnRvIHRoZSB4bWwgVmlld1xuZXhwb3J0IGZ1bmN0aW9uIHBhZ2VMb2FkZWQoYXJnczogRXZlbnREYXRhKSB7XG4gICAgdmFyIHBhZ2UgPSA8UGFnZT5hcmdzLm9iamVjdDtcbiAgICBwYWdlLmJpbmRpbmdDb250ZXh0ID0gbmV3IFBhZ2VNb2RlbChwYWdlKTtcbn0iXX0=