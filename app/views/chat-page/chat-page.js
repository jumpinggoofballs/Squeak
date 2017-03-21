"use strict";
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
    PageModel.prototype.goBack = function () {
        app_navigation_1.navigateBack();
    };
    PageModel.prototype.sendMessage = function () {
        var _this = this;
        if (this.newMessageText) {
            appStore.sendMessage(this.thisFriend._id, this.newMessageText)
                .then(function () {
                _this.set('newMessageText', '');
                _this.getPageData(_this.thisFriend._id);
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
    page.bindingContext = new PageModel(page.navigationContext.chatRef);
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFFeEQsdURBQW9EO0FBSXBELCtDQUFpRDtBQUVqRDtJQUF3Qiw2QkFBVTtJQUs5QixtQkFBWSxPQUFlO1FBQTNCLFlBQ0ksaUJBQU8sU0FJVjtRQUZHLEtBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLEtBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7O0lBQzlCLENBQUM7SUFFTywrQkFBVyxHQUFuQixVQUFvQixTQUFTO1FBQ3pCLElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVNLDBCQUFNLEdBQWI7UUFDSSw2QkFBWSxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVNLCtCQUFXLEdBQWxCO1FBQUEsaUJBUUM7UUFQRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUN0QixRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUM7aUJBQ3pELElBQUksQ0FBQztnQkFDRixLQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQixLQUFJLENBQUMsV0FBVyxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDO0lBQ0wsQ0FBQztJQUVNLGdDQUFZLEdBQW5CO1FBQ0ksNkJBQVksRUFBRSxDQUFDO1FBQ2YsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUFuQ0QsQ0FBd0IsdUJBQVUsR0FtQ2pDO0FBRUQseUNBQXlDO0FBQ3pDLG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUhELGdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnREYXRhLCBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IG5hdmlnYXRlQmFjayB9IGZyb20gJy4uLy4uL2FwcC1uYXZpZ2F0aW9uJztcblxuaW1wb3J0ICogYXMgbW9tZW50IGZyb20gJ21vbWVudCdcblxuaW1wb3J0ICogYXMgYXBwU3RvcmUgZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuXG5jbGFzcyBQYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgdGhpc0ZyaWVuZDogYW55O1xuICAgIHB1YmxpYyBuZXdNZXNzYWdlVGV4dDogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoY2hhdFJlZjogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5uZXdNZXNzYWdlVGV4dCA9ICcnO1xuICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKGNoYXRSZWYpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0UGFnZURhdGEoZnJpZW5kUmVmKSB7XG4gICAgICAgIHZhciB0aGlzQ2hhdEZyaWVuZCA9IGFwcFN0b3JlLmdldEZyaWVuZChmcmllbmRSZWYpO1xuICAgICAgICB0aGlzLnNldCgndGhpc0ZyaWVuZCcsIHRoaXNDaGF0RnJpZW5kKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29CYWNrKCkge1xuICAgICAgICBuYXZpZ2F0ZUJhY2soKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2VuZE1lc3NhZ2UoKSB7XG4gICAgICAgIGlmICh0aGlzLm5ld01lc3NhZ2VUZXh0KSB7XG4gICAgICAgICAgICBhcHBTdG9yZS5zZW5kTWVzc2FnZSh0aGlzLnRoaXNGcmllbmQuX2lkLCB0aGlzLm5ld01lc3NhZ2VUZXh0KVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoJ25ld01lc3NhZ2VUZXh0JywgJycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKHRoaXMudGhpc0ZyaWVuZC5faWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZUZyaWVuZCgpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgICAgIGFwcFN0b3JlLnJlbW92ZUZyaWVuZCh0aGlzLnRoaXNGcmllbmQuX2lkKTtcbiAgICB9XG59XG5cbi8vIE1vdW50IHRoZSBQYWdlIE1vZGVsIG9udG8gdGhlIHhtbCBWaWV3XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKHBhZ2UubmF2aWdhdGlvbkNvbnRleHQuY2hhdFJlZik7XG59Il19