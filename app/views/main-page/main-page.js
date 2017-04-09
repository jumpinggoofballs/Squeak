"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel() {
        var _this = _super.call(this) || this;
        _this.myFriends = new observable_array_1.ObservableArray([]);
        _this.populateFriendsList();
        return _this;
    }
    PageModel.prototype.populateFriendsList = function () {
        var _this = this;
        appStore.getFriendsList()
            .then(function (friendsList) {
            _this.set('myFriends', friendsList);
        }, function (error) {
            alert(error);
        });
    };
    PageModel.prototype.addFriend = function () {
        app_navigation_1.navigateTo('add-friend-page');
    };
    PageModel.prototype.goToSettings = function (args) {
        app_navigation_1.navigateTo('settings-page');
    };
    PageModel.prototype.goToChat = function (args) {
        app_navigation_1.navigateTo('chat-page', this.myFriends[args.index]._id);
    };
    return PageModel;
}(observable_1.Observable));
;
// init the Friends data from the appStore and bind the PageModel to the page;
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel();
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBS3hELCtDQUFpRDtBQUNqRCx1REFBa0Q7QUFFbEQ7SUFBd0IsNkJBQVU7SUFJOUI7UUFBQSxZQUNJLGlCQUFPLFNBS1Y7UUFIRyxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksa0NBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV6QyxLQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzs7SUFDL0IsQ0FBQztJQUVPLHVDQUFtQixHQUEzQjtRQUFBLGlCQU9DO1FBTkcsUUFBUSxDQUFDLGNBQWMsRUFBRTthQUNwQixJQUFJLENBQUMsVUFBQSxXQUFXO1lBQ2IsS0FBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxFQUFFLFVBQUEsS0FBSztZQUNKLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFHTSw2QkFBUyxHQUFoQjtRQUNJLDJCQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sZ0NBQVksR0FBbkIsVUFBb0IsSUFBZTtRQUMvQiwyQkFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSw0QkFBUSxHQUFmLFVBQWdCLElBQUk7UUFDaEIsMkJBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQWpDRCxDQUF3Qix1QkFBVSxHQWlDakM7QUFBQSxDQUFDO0FBR0YsOEVBQThFO0FBQzlFLG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO0FBQzFDLENBQUM7QUFIRCxnQ0FHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICdkYXRhL29ic2VydmFibGUtYXJyYXknO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuXG5pbXBvcnQgeyBGcmllbmQgfSBmcm9tICcuLi8uLi9kYXRhL2FwcC1kYXRhLW1vZGVsJztcbmltcG9ydCAqIGFzIGFwcFN0b3JlIGZyb20gJy4uLy4uL2RhdGEvYXBwLXN0b3JlJztcbmltcG9ydCB7IG5hdmlnYXRlVG8gfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHVibGljIG15RnJpZW5kczogT2JzZXJ2YWJsZUFycmF5PE9iamVjdD47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLm15RnJpZW5kcyA9IG5ldyBPYnNlcnZhYmxlQXJyYXkoW10pO1xuXG4gICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcG9wdWxhdGVGcmllbmRzTGlzdCgpIHtcbiAgICAgICAgYXBwU3RvcmUuZ2V0RnJpZW5kc0xpc3QoKVxuICAgICAgICAgICAgLnRoZW4oZnJpZW5kc0xpc3QgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdteUZyaWVuZHMnLCBmcmllbmRzTGlzdCk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgYWRkRnJpZW5kKCkge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdhZGQtZnJpZW5kLXBhZ2UnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29Ub1NldHRpbmdzKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdzZXR0aW5ncy1wYWdlJyk7XG4gICAgfVxuXG4gICAgcHVibGljIGdvVG9DaGF0KGFyZ3MpIHtcbiAgICAgICAgbmF2aWdhdGVUbygnY2hhdC1wYWdlJywgdGhpcy5teUZyaWVuZHNbYXJncy5pbmRleF0uX2lkKTtcbiAgICB9XG59O1xuXG5cbi8vIGluaXQgdGhlIEZyaWVuZHMgZGF0YSBmcm9tIHRoZSBhcHBTdG9yZSBhbmQgYmluZCB0aGUgUGFnZU1vZGVsIHRvIHRoZSBwYWdlO1xuZXhwb3J0IGZ1bmN0aW9uIHBhZ2VMb2FkZWQoYXJnczogRXZlbnREYXRhKSB7XG4gICAgdmFyIHBhZ2UgPSA8UGFnZT5hcmdzLm9iamVjdDtcbiAgICBwYWdlLmJpbmRpbmdDb250ZXh0ID0gbmV3IFBhZ2VNb2RlbCgpO1xufSJdfQ==