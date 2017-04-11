"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
        _this.myFriends = new observable_array_1.ObservableArray([]);
        _this.populateFriendsList();
        pageRef.on('refreshData', function () { return _this.populateFriendsList(); });
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
    page.bindingContext = new PageModel(page);
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBS3hELCtDQUFpRDtBQUNqRCx1REFBa0Q7QUFFbEQ7SUFBd0IsNkJBQVU7SUFLOUIsbUJBQVksT0FBTztRQUFuQixZQUNJLGlCQUFPLFNBUVY7UUFORyxLQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksa0NBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV6QyxLQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUUzQixPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxjQUFNLE9BQUEsS0FBSSxDQUFDLG1CQUFtQixFQUFFLEVBQTFCLENBQTBCLENBQUMsQ0FBQzs7SUFDaEUsQ0FBQztJQUVPLHVDQUFtQixHQUEzQjtRQUFBLGlCQU9DO1FBTkcsUUFBUSxDQUFDLGNBQWMsRUFBRTthQUNwQixJQUFJLENBQUMsVUFBQSxXQUFXO1lBQ2IsS0FBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxFQUFFLFVBQUEsS0FBSztZQUNKLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFHTSw2QkFBUyxHQUFoQjtRQUNJLDJCQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sZ0NBQVksR0FBbkIsVUFBb0IsSUFBZTtRQUMvQiwyQkFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSw0QkFBUSxHQUFmLFVBQWdCLElBQUk7UUFDaEIsMkJBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQXJDRCxDQUF3Qix1QkFBVSxHQXFDakM7QUFBQSxDQUFDO0FBR0YsOEVBQThFO0FBQzlFLG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBSEQsZ0NBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEsIE9ic2VydmFibGUgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZUFycmF5IH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlLWFycmF5JztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IExpc3RWaWV3IH0gZnJvbSAndWkvbGlzdC12aWV3JztcblxuaW1wb3J0IHsgRnJpZW5kIH0gZnJvbSAnLi4vLi4vZGF0YS9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgKiBhcyBhcHBTdG9yZSBmcm9tICcuLi8uLi9kYXRhL2FwcC1zdG9yZSc7XG5pbXBvcnQgeyBuYXZpZ2F0ZVRvIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuXG5jbGFzcyBQYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgcGFnZVJlZjtcbiAgICBwdWJsaWMgbXlGcmllbmRzOiBPYnNlcnZhYmxlQXJyYXk8T2JqZWN0PjtcblxuICAgIGNvbnN0cnVjdG9yKHBhZ2VSZWYpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnBhZ2VSZWYgPSBwYWdlUmVmO1xuICAgICAgICB0aGlzLm15RnJpZW5kcyA9IG5ldyBPYnNlcnZhYmxlQXJyYXkoW10pO1xuXG4gICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuXG4gICAgICAgIHBhZ2VSZWYub24oJ3JlZnJlc2hEYXRhJywgKCkgPT4gdGhpcy5wb3B1bGF0ZUZyaWVuZHNMaXN0KCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcG9wdWxhdGVGcmllbmRzTGlzdCgpIHtcbiAgICAgICAgYXBwU3RvcmUuZ2V0RnJpZW5kc0xpc3QoKVxuICAgICAgICAgICAgLnRoZW4oZnJpZW5kc0xpc3QgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdteUZyaWVuZHMnLCBmcmllbmRzTGlzdCk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgYWRkRnJpZW5kKCkge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdhZGQtZnJpZW5kLXBhZ2UnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29Ub1NldHRpbmdzKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdzZXR0aW5ncy1wYWdlJyk7XG4gICAgfVxuXG4gICAgcHVibGljIGdvVG9DaGF0KGFyZ3MpIHtcbiAgICAgICAgbmF2aWdhdGVUbygnY2hhdC1wYWdlJywgdGhpcy5teUZyaWVuZHNbYXJncy5pbmRleF0uX2lkKTtcbiAgICB9XG59O1xuXG5cbi8vIGluaXQgdGhlIEZyaWVuZHMgZGF0YSBmcm9tIHRoZSBhcHBTdG9yZSBhbmQgYmluZCB0aGUgUGFnZU1vZGVsIHRvIHRoZSBwYWdlO1xuZXhwb3J0IGZ1bmN0aW9uIHBhZ2VMb2FkZWQoYXJnczogRXZlbnREYXRhKSB7XG4gICAgdmFyIHBhZ2UgPSA8UGFnZT5hcmdzLm9iamVjdDtcbiAgICBwYWdlLmJpbmRpbmdDb250ZXh0ID0gbmV3IFBhZ2VNb2RlbChwYWdlKTtcbn0iXX0=