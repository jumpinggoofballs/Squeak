"use strict";
var observable_1 = require("data/observable");
var timer = require("timer");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFHeEQsNkJBQStCO0FBRS9CLCtDQUFpRDtBQUNqRCx1REFBb0Q7QUFFcEQ7SUFBd0IsNkJBQVU7SUFNOUIsbUJBQVksT0FBWTtRQUF4QixZQUNJLGlCQUFPLFNBVVY7UUFURyxLQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixLQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsS0FBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFMUIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsS0FBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQUVPLCtCQUFXLEdBQW5CO1FBQ0ksSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7UUFDdkQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUV2QywyQ0FBMkM7UUFDM0MsY0FBYyxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQztRQUN4QyxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRU0scUNBQWlCLEdBQXhCO1FBQUEsaUJBSUM7UUFIRyxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQ2IsS0FBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFTSwwQkFBTSxHQUFiO1FBQ0ksNkJBQVksRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFTSxzQ0FBa0IsR0FBekIsVUFBMEIsT0FBZ0I7UUFDdEMsSUFBSSxXQUFXLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDckUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsV0FBVyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztJQUNMLENBQUM7SUFFTSwrQkFBVyxHQUFsQjtRQUFBLGlCQVVDO1FBVEcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDO2lCQUN6RCxJQUFJLENBQUM7Z0JBQ0YsS0FBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDL0IsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNuQixLQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDekIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ25FLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztJQUNMLENBQUM7SUFFTSxnQ0FBWSxHQUFuQjtRQUNJLDZCQUFZLEVBQUUsQ0FBQztRQUNmLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBaEVELENBQXdCLHVCQUFVLEdBZ0VqQztBQUVELHlDQUF5QztBQUN6QyxvQkFBMkIsSUFBZTtJQUN0QyxJQUFJLElBQUksR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUhELGdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnREYXRhLCBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IExpc3RWaWV3IH0gZnJvbSAndWkvbGlzdC12aWV3JztcbmltcG9ydCAqIGFzIHRpbWVyIGZyb20gJ3RpbWVyJztcblxuaW1wb3J0ICogYXMgYXBwU3RvcmUgZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuaW1wb3J0IHsgbmF2aWdhdGVCYWNrIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuXG5jbGFzcyBQYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgdGhpc0ZyaWVuZDogYW55O1xuICAgIHByaXZhdGUgcGFnZVJlZjogYW55O1xuICAgIHB1YmxpYyBuZXdNZXNzYWdlVGV4dDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocGFnZVJlZjogYW55KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFnZVJlZiA9IHBhZ2VSZWY7XG4gICAgICAgIHRoaXMubmV3TWVzc2FnZVRleHQgPSAnJztcbiAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICB0aGlzLnNjcm9sbE1lc3NhZ2VzTGlzdCgpO1xuXG4gICAgICAgIHBhZ2VSZWYub24oJ25ld01lc3NhZ2VSZWNlaXZlZCcsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2V0UGFnZURhdGEoKTtcbiAgICAgICAgICAgIHRoaXMucmVTY3JvbGxXaXRoRGVsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRQYWdlRGF0YSgpIHtcbiAgICAgICAgdmFyIGZyaWVuZFJlZiA9IHRoaXMucGFnZVJlZi5uYXZpZ2F0aW9uQ29udGV4dC5jaGF0UmVmO1xuICAgICAgICB2YXIgdGhpc0NoYXRGcmllbmQgPSBhcHBTdG9yZS5nZXRGcmllbmQoZnJpZW5kUmVmKTtcbiAgICAgICAgdGhpcy5zZXQoJ3RoaXNGcmllbmQnLCB0aGlzQ2hhdEZyaWVuZCk7XG5cbiAgICAgICAgLy8gdGhlbiBtYXJrIGFsbCBtZXNzYWdlcyBhcyByZWFkIChsb2NhbGx5KVxuICAgICAgICB0aGlzQ2hhdEZyaWVuZC51bnJlYWRNZXNzYWdlc051bWJlciA9IDA7XG4gICAgICAgIGFwcFN0b3JlLnVwZGF0ZUZyaWVuZChmcmllbmRSZWYsIHRoaXNDaGF0RnJpZW5kKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVTY3JvbGxXaXRoRGVsYXkoKSB7XG4gICAgICAgIHRpbWVyLnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxNZXNzYWdlc0xpc3QoJ2FuaW1hdGUnKTtcbiAgICAgICAgfSwgODAwKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29CYWNrKCkge1xuICAgICAgICBuYXZpZ2F0ZUJhY2soKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2Nyb2xsTWVzc2FnZXNMaXN0KGFuaW1hdGU/OiBzdHJpbmcpIHtcbiAgICAgICAgdmFyIGxpc3RWaWV3UmVmID0gPExpc3RWaWV3PnRoaXMucGFnZVJlZi5nZXRWaWV3QnlJZCgnbWVzc2FnZXNMaXN0Jyk7XG4gICAgICAgIGlmIChsaXN0Vmlld1JlZi5hbmRyb2lkICYmIChhbmltYXRlID09PSAnYW5pbWF0ZScpKSB7XG4gICAgICAgICAgICBsaXN0Vmlld1JlZi5hbmRyb2lkLnNtb290aFNjcm9sbFRvUG9zaXRpb24odGhpcy50aGlzRnJpZW5kLm1lc3NhZ2VzLmxlbmd0aCAtIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGlzdFZpZXdSZWYuc2Nyb2xsVG9JbmRleCh0aGlzLnRoaXNGcmllbmQubWVzc2FnZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc2VuZE1lc3NhZ2UoKSB7XG4gICAgICAgIGlmICh0aGlzLm5ld01lc3NhZ2VUZXh0KSB7XG4gICAgICAgICAgICBhcHBTdG9yZS5zZW5kTWVzc2FnZSh0aGlzLnRoaXNGcmllbmQuX2lkLCB0aGlzLm5ld01lc3NhZ2VUZXh0KVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoJ25ld01lc3NhZ2VUZXh0JywgJycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVTY3JvbGxXaXRoRGVsYXkoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYWdlUmVmLmdldFZpZXdCeUlkKCduZXdNZXNzYWdlSW5wdXQnKS5kaXNtaXNzU29mdElucHV0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlRnJpZW5kKCkge1xuICAgICAgICBuYXZpZ2F0ZUJhY2soKTtcbiAgICAgICAgYXBwU3RvcmUucmVtb3ZlRnJpZW5kKHRoaXMudGhpc0ZyaWVuZC5faWQpO1xuICAgIH1cbn1cblxuLy8gTW91bnQgdGhlIFBhZ2UgTW9kZWwgb250byB0aGUgeG1sIFZpZXdcbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWwocGFnZSk7XG59Il19