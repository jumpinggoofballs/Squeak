"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var observable_1 = require("data/observable");
var app_navigation_1 = require("../../app-navigation");
var appStore = require("../../data/app-store");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(chatRef) {
        var _this = _super.call(this) || this;
        _this.newMessageText = '';
        _this.getPageData(chatRef);
        return _this;
    }
    PageModel.prototype.getPageData = function (friendRef) {
        var thisChatFriend = appStore.getFriend(friendRef);
        this.set('thisFriend', thisChatFriend);
    };
    PageModel.prototype.removeFriend = function () {
        app_navigation_1.navigateBack();
        appStore.removeFriend(this.thisFriend._id);
    };
    PageModel.prototype.goBack = function () {
        app_navigation_1.navigateBack();
    };
    PageModel.prototype.sendMessage = function () {
        var _this = this;
        appStore.sendMessage(this.thisFriend._id, this.newMessageText)
            .then(function () {
            _this.set('newMessageText', '');
            _this.getPageData(_this.thisFriend._id);
        });
    };
    return PageModel;
}(observable_1.Observable));
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel(page.navigationContext.chatRef);
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUF3RDtBQUV4RCx1REFBb0Q7QUFFcEQsK0NBQWlEO0FBRWpEO0lBQXdCLDZCQUFVO0lBSzlCLG1CQUFZLE9BQWU7UUFBM0IsWUFDSSxpQkFBTyxTQUlWO1FBRkcsS0FBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7UUFDekIsS0FBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7SUFDOUIsQ0FBQztJQUVPLCtCQUFXLEdBQW5CLFVBQW9CLFNBQVM7UUFDekIsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRU0sZ0NBQVksR0FBbkI7UUFDSSw2QkFBWSxFQUFFLENBQUM7UUFDZixRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVNLDBCQUFNLEdBQWI7UUFDSSw2QkFBWSxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVNLCtCQUFXLEdBQWxCO1FBQUEsaUJBTUM7UUFMRyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUM7YUFDekQsSUFBSSxDQUFDO1lBQ0YsS0FBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvQixLQUFJLENBQUMsV0FBVyxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBakNELENBQXdCLHVCQUFVLEdBaUNqQztBQUVELG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUhELGdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnREYXRhLCBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IG5hdmlnYXRlQmFjayB9IGZyb20gJy4uLy4uL2FwcC1uYXZpZ2F0aW9uJztcblxuaW1wb3J0ICogYXMgYXBwU3RvcmUgZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuXG5jbGFzcyBQYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgdGhpc0ZyaWVuZDogYW55O1xuICAgIHB1YmxpYyBuZXdNZXNzYWdlVGV4dDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoY2hhdFJlZjogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5uZXdNZXNzYWdlVGV4dCA9ICcnO1xuICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKGNoYXRSZWYpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0UGFnZURhdGEoZnJpZW5kUmVmKSB7XG4gICAgICAgIHZhciB0aGlzQ2hhdEZyaWVuZCA9IGFwcFN0b3JlLmdldEZyaWVuZChmcmllbmRSZWYpO1xuICAgICAgICB0aGlzLnNldCgndGhpc0ZyaWVuZCcsIHRoaXNDaGF0RnJpZW5kKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlRnJpZW5kKCkge1xuICAgICAgICBuYXZpZ2F0ZUJhY2soKTtcbiAgICAgICAgYXBwU3RvcmUucmVtb3ZlRnJpZW5kKHRoaXMudGhpc0ZyaWVuZC5faWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb0JhY2soKSB7XG4gICAgICAgIG5hdmlnYXRlQmFjaygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZW5kTWVzc2FnZSgpIHtcbiAgICAgICAgYXBwU3RvcmUuc2VuZE1lc3NhZ2UodGhpcy50aGlzRnJpZW5kLl9pZCwgdGhpcy5uZXdNZXNzYWdlVGV4dClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCgnbmV3TWVzc2FnZVRleHQnLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSh0aGlzLnRoaXNGcmllbmQuX2lkKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhZ2VMb2FkZWQoYXJnczogRXZlbnREYXRhKSB7XG4gICAgdmFyIHBhZ2UgPSA8UGFnZT5hcmdzLm9iamVjdDtcbiAgICBwYWdlLmJpbmRpbmdDb250ZXh0ID0gbmV3IFBhZ2VNb2RlbChwYWdlLm5hdmlnYXRpb25Db250ZXh0LmNoYXRSZWYpO1xufVxuIl19