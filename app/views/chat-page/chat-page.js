"use strict";
var observable_1 = require("data/observable");
var app_navigation_1 = require("../../app-navigation");
var appStore = require("../../data/app-store");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(chatRef) {
        var _this = _super.call(this) || this;
        _this.chatName = 'Chat';
        _this.chatRef = chatRef;
        _this.getPageData(chatRef);
        return _this;
    }
    PageModel.prototype.getPageData = function (friendRef) {
        var _this = this;
        appStore.getFriendsList()
            .then(function (friendsList) {
            var thisFriend = friendsList[friendRef];
            _this.set('chatName', thisFriend.nickname);
        });
    };
    PageModel.prototype.removeFriend = function () {
        var chatRef = parseInt(this.chatRef);
        app_navigation_1.navigateBack();
        appStore.removeFriend(chatRef);
    };
    PageModel.prototype.goBack = function () {
        app_navigation_1.navigateBack();
    };
    return PageModel;
}(observable_1.Observable));
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel(page.navigationContext.chatRef);
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFFeEQsdURBQW9EO0FBRXBELCtDQUFpRDtBQUVqRDtJQUF3Qiw2QkFBVTtJQUs5QixtQkFBWSxPQUFlO1FBQTNCLFlBQ0ksaUJBQU8sU0FLVjtRQUpHLEtBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLEtBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLEtBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7O0lBQzlCLENBQUM7SUFFTywrQkFBVyxHQUFuQixVQUFvQixTQUFTO1FBQTdCLGlCQU1DO1FBTEcsUUFBUSxDQUFDLGNBQWMsRUFBRTthQUNwQixJQUFJLENBQUMsVUFBQSxXQUFXO1lBQ2IsSUFBSSxVQUFVLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3hDLEtBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFFTSxnQ0FBWSxHQUFuQjtRQUNJLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsNkJBQVksRUFBRSxDQUFDO1FBQ2YsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRU0sMEJBQU0sR0FBYjtRQUNJLDZCQUFZLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBOUJELENBQXdCLHVCQUFVLEdBOEJqQztBQUVELG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUhELGdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnREYXRhLCBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IG5hdmlnYXRlQmFjayB9IGZyb20gJy4uLy4uL2FwcC1uYXZpZ2F0aW9uJztcblxuaW1wb3J0ICogYXMgYXBwU3RvcmUgZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuXG5jbGFzcyBQYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgY2hhdFJlZjogc3RyaW5nO1xuICAgIHB1YmxpYyBjaGF0TmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoY2hhdFJlZjogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY2hhdE5hbWUgPSAnQ2hhdCc7XG4gICAgICAgIHRoaXMuY2hhdFJlZiA9IGNoYXRSZWY7XG5cbiAgICAgICAgdGhpcy5nZXRQYWdlRGF0YShjaGF0UmVmKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFBhZ2VEYXRhKGZyaWVuZFJlZikge1xuICAgICAgICBhcHBTdG9yZS5nZXRGcmllbmRzTGlzdCgpXG4gICAgICAgICAgICAudGhlbihmcmllbmRzTGlzdCA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHRoaXNGcmllbmQgPSBmcmllbmRzTGlzdFtmcmllbmRSZWZdO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdjaGF0TmFtZScsIHRoaXNGcmllbmQubmlja25hbWUpO1xuICAgICAgICAgICAgfSlcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlRnJpZW5kKCkge1xuICAgICAgICB2YXIgY2hhdFJlZiA9IHBhcnNlSW50KHRoaXMuY2hhdFJlZik7XG4gICAgICAgIG5hdmlnYXRlQmFjaygpO1xuICAgICAgICBhcHBTdG9yZS5yZW1vdmVGcmllbmQoY2hhdFJlZik7XG4gICAgfVxuXG4gICAgcHVibGljIGdvQmFjaygpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKHBhZ2UubmF2aWdhdGlvbkNvbnRleHQuY2hhdFJlZik7XG59XG4iXX0=