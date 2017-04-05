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
        var _this = this;
        appStore.addFriend('Test friend')
            .then(function () {
            _this.populateFriendsList();
        }, function (error) {
            alert(error);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBS3hELCtDQUFpRDtBQUNqRCx1REFBa0Q7QUFFbEQ7SUFBd0IsNkJBQVU7SUFJOUI7UUFBQSxZQUNJLGlCQUFPLFNBS1Y7UUFIRyxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksa0NBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV6QyxLQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzs7SUFDL0IsQ0FBQztJQUVPLHVDQUFtQixHQUEzQjtRQUFBLGlCQU9DO1FBTkcsUUFBUSxDQUFDLGNBQWMsRUFBRTthQUNwQixJQUFJLENBQUMsVUFBQSxXQUFXO1lBQ2IsS0FBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxFQUFFLFVBQUEsS0FBSztZQUNKLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFHTSw2QkFBUyxHQUFoQjtRQUFBLGlCQU9DO1FBTkcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7YUFDNUIsSUFBSSxDQUFDO1lBQ0YsS0FBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDL0IsQ0FBQyxFQUFFLFVBQUEsS0FBSztZQUNKLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTSxnQ0FBWSxHQUFuQixVQUFvQixJQUFlO1FBQy9CLDJCQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVNLDRCQUFRLEdBQWYsVUFBZ0IsSUFBSTtRQUNoQiwyQkFBVSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBdENELENBQXdCLHVCQUFVLEdBc0NqQztBQUFBLENBQUM7QUFHRiw4RUFBOEU7QUFDOUUsb0JBQTJCLElBQWU7SUFDdEMsSUFBSSxJQUFJLEdBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7QUFDMUMsQ0FBQztBQUhELGdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnREYXRhLCBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IE9ic2VydmFibGVBcnJheSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZS1hcnJheSc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAndWkvcGFnZSc7XG5pbXBvcnQgeyBMaXN0VmlldyB9IGZyb20gJ3VpL2xpc3Qtdmlldyc7XG5cbmltcG9ydCB7IEZyaWVuZCB9IGZyb20gJy4uLy4uL2RhdGEvYXBwLWRhdGEtbW9kZWwnO1xuaW1wb3J0ICogYXMgYXBwU3RvcmUgZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuaW1wb3J0IHsgbmF2aWdhdGVUbyB9IGZyb20gJy4uLy4uL2FwcC1uYXZpZ2F0aW9uJztcblxuY2xhc3MgUGFnZU1vZGVsIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG5cbiAgICBwdWJsaWMgbXlGcmllbmRzOiBPYnNlcnZhYmxlQXJyYXk8T2JqZWN0PjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMubXlGcmllbmRzID0gbmV3IE9ic2VydmFibGVBcnJheShbXSk7XG5cbiAgICAgICAgdGhpcy5wb3B1bGF0ZUZyaWVuZHNMaXN0KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwb3B1bGF0ZUZyaWVuZHNMaXN0KCkge1xuICAgICAgICBhcHBTdG9yZS5nZXRGcmllbmRzTGlzdCgpXG4gICAgICAgICAgICAudGhlbihmcmllbmRzTGlzdCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQoJ215RnJpZW5kcycsIGZyaWVuZHNMaXN0KTtcbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyBhZGRGcmllbmQoKSB7XG4gICAgICAgIGFwcFN0b3JlLmFkZEZyaWVuZCgnVGVzdCBmcmllbmQnKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb1RvU2V0dGluZ3MoYXJnczogRXZlbnREYXRhKSB7XG4gICAgICAgIG5hdmlnYXRlVG8oJ3NldHRpbmdzLXBhZ2UnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29Ub0NoYXQoYXJncykge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdjaGF0LXBhZ2UnLCB0aGlzLm15RnJpZW5kc1thcmdzLmluZGV4XS5faWQpO1xuICAgIH1cbn07XG5cblxuLy8gaW5pdCB0aGUgRnJpZW5kcyBkYXRhIGZyb20gdGhlIGFwcFN0b3JlIGFuZCBiaW5kIHRoZSBQYWdlTW9kZWwgdG8gdGhlIHBhZ2U7XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKCk7XG59Il19