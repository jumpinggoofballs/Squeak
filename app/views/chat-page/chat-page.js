"use strict";
var observable_1 = require("data/observable");
var app_navigation_1 = require("../../app-navigation");
var timer = require("timer");
var appStore = require("../../data/app-store");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFHeEQsdURBQW9EO0FBQ3BELDZCQUErQjtBQUUvQiwrQ0FBaUQ7QUFFakQ7SUFBd0IsNkJBQVU7SUFNOUIsbUJBQVksT0FBWTtRQUF4QixZQUNJLGlCQUFPLFNBVVY7UUFURyxLQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixLQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsS0FBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFMUIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsS0FBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQUVPLCtCQUFXLEdBQW5CO1FBQ0ksSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7UUFDdkQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRU0scUNBQWlCLEdBQXhCO1FBQUEsaUJBSUM7UUFIRyxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQ2IsS0FBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFTSwwQkFBTSxHQUFiO1FBQ0ksNkJBQVksRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFTSxzQ0FBa0IsR0FBekIsVUFBMEIsT0FBZ0I7UUFDdEMsSUFBSSxXQUFXLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDckUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsV0FBVyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztJQUNMLENBQUM7SUFFTSwrQkFBVyxHQUFsQjtRQUFBLGlCQVVDO1FBVEcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDO2lCQUN6RCxJQUFJLENBQUM7Z0JBQ0YsS0FBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDL0IsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNuQixLQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDekIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ25FLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztJQUNMLENBQUM7SUFFTSxnQ0FBWSxHQUFuQjtRQUNJLDZCQUFZLEVBQUUsQ0FBQztRQUNmLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBNURELENBQXdCLHVCQUFVLEdBNERqQztBQUVELHlDQUF5QztBQUN6QyxvQkFBMkIsSUFBZTtJQUN0QyxJQUFJLElBQUksR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUhELGdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnREYXRhLCBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IExpc3RWaWV3IH0gZnJvbSAndWkvbGlzdC12aWV3JztcbmltcG9ydCB7IG5hdmlnYXRlQmFjayB9IGZyb20gJy4uLy4uL2FwcC1uYXZpZ2F0aW9uJztcbmltcG9ydCAqIGFzIHRpbWVyIGZyb20gJ3RpbWVyJztcblxuaW1wb3J0ICogYXMgYXBwU3RvcmUgZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuXG5jbGFzcyBQYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgdGhpc0ZyaWVuZDogYW55O1xuICAgIHByaXZhdGUgcGFnZVJlZjogYW55O1xuICAgIHB1YmxpYyBuZXdNZXNzYWdlVGV4dDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocGFnZVJlZjogYW55KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFnZVJlZiA9IHBhZ2VSZWY7XG4gICAgICAgIHRoaXMubmV3TWVzc2FnZVRleHQgPSAnJztcbiAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICB0aGlzLnNjcm9sbE1lc3NhZ2VzTGlzdCgpO1xuXG4gICAgICAgIHBhZ2VSZWYub24oJ25ld01lc3NhZ2VSZWNlaXZlZCcsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2V0UGFnZURhdGEoKTtcbiAgICAgICAgICAgIHRoaXMucmVTY3JvbGxXaXRoRGVsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRQYWdlRGF0YSgpIHtcbiAgICAgICAgdmFyIGZyaWVuZFJlZiA9IHRoaXMucGFnZVJlZi5uYXZpZ2F0aW9uQ29udGV4dC5jaGF0UmVmO1xuICAgICAgICB2YXIgdGhpc0NoYXRGcmllbmQgPSBhcHBTdG9yZS5nZXRGcmllbmQoZnJpZW5kUmVmKTtcbiAgICAgICAgdGhpcy5zZXQoJ3RoaXNGcmllbmQnLCB0aGlzQ2hhdEZyaWVuZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlU2Nyb2xsV2l0aERlbGF5KCkge1xuICAgICAgICB0aW1lci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWVzc2FnZXNMaXN0KCdhbmltYXRlJyk7XG4gICAgICAgIH0sIDgwMCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdvQmFjaygpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNjcm9sbE1lc3NhZ2VzTGlzdChhbmltYXRlPzogc3RyaW5nKSB7XG4gICAgICAgIHZhciBsaXN0Vmlld1JlZiA9IDxMaXN0Vmlldz50aGlzLnBhZ2VSZWYuZ2V0Vmlld0J5SWQoJ21lc3NhZ2VzTGlzdCcpO1xuICAgICAgICBpZiAobGlzdFZpZXdSZWYuYW5kcm9pZCAmJiAoYW5pbWF0ZSA9PT0gJ2FuaW1hdGUnKSkge1xuICAgICAgICAgICAgbGlzdFZpZXdSZWYuYW5kcm9pZC5zbW9vdGhTY3JvbGxUb1Bvc2l0aW9uKHRoaXMudGhpc0ZyaWVuZC5tZXNzYWdlcy5sZW5ndGggLSAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpc3RWaWV3UmVmLnNjcm9sbFRvSW5kZXgodGhpcy50aGlzRnJpZW5kLm1lc3NhZ2VzLmxlbmd0aCAtIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNlbmRNZXNzYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5uZXdNZXNzYWdlVGV4dCkge1xuICAgICAgICAgICAgYXBwU3RvcmUuc2VuZE1lc3NhZ2UodGhpcy50aGlzRnJpZW5kLl9pZCwgdGhpcy5uZXdNZXNzYWdlVGV4dClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCduZXdNZXNzYWdlVGV4dCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlU2Nyb2xsV2l0aERlbGF5KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFnZVJlZi5nZXRWaWV3QnlJZCgnbmV3TWVzc2FnZUlucHV0JykuZGlzbWlzc1NvZnRJbnB1dCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZUZyaWVuZCgpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgICAgIGFwcFN0b3JlLnJlbW92ZUZyaWVuZCh0aGlzLnRoaXNGcmllbmQuX2lkKTtcbiAgICB9XG59XG5cbi8vIE1vdW50IHRoZSBQYWdlIE1vZGVsIG9udG8gdGhlIHhtbCBWaWV3XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKHBhZ2UpO1xufSJdfQ==