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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFHeEQsdURBQW9EO0FBQ3BELDZCQUErQjtBQUUvQiwrQ0FBaUQ7QUFFakQ7SUFBd0IsNkJBQVU7SUFNOUIsbUJBQVksT0FBWTtRQUF4QixZQUNJLGlCQUFPLFNBVVY7UUFURyxLQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixLQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsS0FBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFMUIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsS0FBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQUVPLCtCQUFXLEdBQW5CO1FBQ0ksSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7UUFDdkQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRU0scUNBQWlCLEdBQXhCO1FBQUEsaUJBSUM7UUFIRyxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQ2IsS0FBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFTSwwQkFBTSxHQUFiO1FBQ0ksNkJBQVksRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFTSxzQ0FBa0IsR0FBekIsVUFBMEIsT0FBZ0I7UUFDdEMsSUFBSSxXQUFXLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDckUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsV0FBVyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztJQUNMLENBQUM7SUFFTSwrQkFBVyxHQUFsQjtRQUFBLGlCQVNDO1FBUkcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDO2lCQUN6RCxJQUFJLENBQUM7Z0JBQ0YsS0FBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDL0IsS0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNuQixLQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUM3QixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7SUFDTCxDQUFDO0lBRU0sZ0NBQVksR0FBbkI7UUFDSSw2QkFBWSxFQUFFLENBQUM7UUFDZixRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQTNERCxDQUF3Qix1QkFBVSxHQTJEakM7QUFFRCx5Q0FBeUM7QUFDekMsb0JBQTJCLElBQWU7SUFDdEMsSUFBSSxJQUFJLEdBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFIRCxnQ0FHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAndWkvcGFnZSc7XG5pbXBvcnQgeyBMaXN0VmlldyB9IGZyb20gJ3VpL2xpc3Qtdmlldyc7XG5pbXBvcnQgeyBuYXZpZ2F0ZUJhY2sgfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG5pbXBvcnQgKiBhcyB0aW1lciBmcm9tICd0aW1lcic7XG5cbmltcG9ydCAqIGFzIGFwcFN0b3JlIGZyb20gJy4uLy4uL2RhdGEvYXBwLXN0b3JlJztcblxuY2xhc3MgUGFnZU1vZGVsIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG5cbiAgICBwcml2YXRlIHRoaXNGcmllbmQ6IGFueTtcbiAgICBwcml2YXRlIHBhZ2VSZWY6IGFueTtcbiAgICBwdWJsaWMgbmV3TWVzc2FnZVRleHQ6IHN0cmluZztcblxuICAgIGNvbnN0cnVjdG9yKHBhZ2VSZWY6IGFueSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnBhZ2VSZWYgPSBwYWdlUmVmO1xuICAgICAgICB0aGlzLm5ld01lc3NhZ2VUZXh0ID0gJyc7XG4gICAgICAgIHRoaXMuZ2V0UGFnZURhdGEoKTtcbiAgICAgICAgdGhpcy5zY3JvbGxNZXNzYWdlc0xpc3QoKTtcblxuICAgICAgICBwYWdlUmVmLm9uKCduZXdNZXNzYWdlUmVjZWl2ZWQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKCk7XG4gICAgICAgICAgICB0aGlzLnJlU2Nyb2xsV2l0aERlbGF5KCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0UGFnZURhdGEoKSB7XG4gICAgICAgIHZhciBmcmllbmRSZWYgPSB0aGlzLnBhZ2VSZWYubmF2aWdhdGlvbkNvbnRleHQuY2hhdFJlZjtcbiAgICAgICAgdmFyIHRoaXNDaGF0RnJpZW5kID0gYXBwU3RvcmUuZ2V0RnJpZW5kKGZyaWVuZFJlZik7XG4gICAgICAgIHRoaXMuc2V0KCd0aGlzRnJpZW5kJywgdGhpc0NoYXRGcmllbmQpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZVNjcm9sbFdpdGhEZWxheSgpIHtcbiAgICAgICAgdGltZXIuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbE1lc3NhZ2VzTGlzdCgnYW5pbWF0ZScpO1xuICAgICAgICB9LCA4MDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb0JhY2soKSB7XG4gICAgICAgIG5hdmlnYXRlQmFjaygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzY3JvbGxNZXNzYWdlc0xpc3QoYW5pbWF0ZT86IHN0cmluZykge1xuICAgICAgICB2YXIgbGlzdFZpZXdSZWYgPSA8TGlzdFZpZXc+dGhpcy5wYWdlUmVmLmdldFZpZXdCeUlkKCdtZXNzYWdlc0xpc3QnKTtcbiAgICAgICAgaWYgKGxpc3RWaWV3UmVmLmFuZHJvaWQgJiYgKGFuaW1hdGUgPT09ICdhbmltYXRlJykpIHtcbiAgICAgICAgICAgIGxpc3RWaWV3UmVmLmFuZHJvaWQuc21vb3RoU2Nyb2xsVG9Qb3NpdGlvbih0aGlzLnRoaXNGcmllbmQubWVzc2FnZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaXN0Vmlld1JlZi5zY3JvbGxUb0luZGV4KHRoaXMudGhpc0ZyaWVuZC5tZXNzYWdlcy5sZW5ndGggLSAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzZW5kTWVzc2FnZSgpIHtcbiAgICAgICAgaWYgKHRoaXMubmV3TWVzc2FnZVRleHQpIHtcbiAgICAgICAgICAgIGFwcFN0b3JlLnNlbmRNZXNzYWdlKHRoaXMudGhpc0ZyaWVuZC5faWQsIHRoaXMubmV3TWVzc2FnZVRleHQpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCgnbmV3TWVzc2FnZVRleHQnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0UGFnZURhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZVNjcm9sbFdpdGhEZWxheSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZUZyaWVuZCgpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgICAgIGFwcFN0b3JlLnJlbW92ZUZyaWVuZCh0aGlzLnRoaXNGcmllbmQuX2lkKTtcbiAgICB9XG59XG5cbi8vIE1vdW50IHRoZSBQYWdlIE1vZGVsIG9udG8gdGhlIHhtbCBWaWV3XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKHBhZ2UpO1xufSJdfQ==