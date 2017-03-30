"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
var notify = require("../../data/notification");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel() {
        var _this = _super.call(this) || this;
        _this.myFriends = new observable_array_1.ObservableArray([]);
        notify.notificationListenerInit();
        notify.scheduleAlert();
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
        appStore.addFriend('add test friend')
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
        app_navigation_1.navigateTo('chat-page', this.myFriends[args.index]._title);
    };
    return PageModel;
}(observable_1.Observable));
;
// init the Friends data from the appStore and bind the PageModel to the page;
function pageLoaded(args) {
    var page = args.object;
    appStore.initAppData()
        .then(function (logMessage) {
        notify.LocalNotificationsRef.requestPermission().then(function (granted) {
            if (granted) {
                page.bindingContext = new PageModel();
            }
        });
    }, function (error) {
        alert(error);
    });
    // // This makes the phone Status Bar the same color as the app Action Bar (??)
    // import { setStatusBarColorsIOS } from '../../shared/status-bar-util';
    // page.style.marginTop = -20;
    // page.style.paddingTop = 20;
    // setStatusBarColorsIOS();
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBS3hELCtDQUFpRDtBQUNqRCx1REFBa0Q7QUFFbEQsZ0RBQWtEO0FBRWxEO0lBQXdCLDZCQUFVO0lBSTlCO1FBQUEsWUFDSSxpQkFBTyxTQVFWO1FBTkcsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGtDQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFekMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDbEMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXZCLEtBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDOztJQUMvQixDQUFDO0lBRU8sdUNBQW1CLEdBQTNCO1FBQUEsaUJBT0M7UUFORyxRQUFRLENBQUMsY0FBYyxFQUFFO2FBQ3BCLElBQUksQ0FBQyxVQUFBLFdBQVc7WUFDYixLQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN2QyxDQUFDLEVBQUUsVUFBQSxLQUFLO1lBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUdNLDZCQUFTLEdBQWhCO1FBQUEsaUJBT0M7UUFORyxRQUFRLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDO2FBQ2hDLElBQUksQ0FBQztZQUNGLEtBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQy9CLENBQUMsRUFBRSxVQUFBLEtBQUs7WUFDSixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sZ0NBQVksR0FBbkIsVUFBb0IsSUFBZTtRQUMvQiwyQkFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSw0QkFBUSxHQUFmLFVBQWdCLElBQUk7UUFDaEIsMkJBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQXpDRCxDQUF3Qix1QkFBVSxHQXlDakM7QUFBQSxDQUFDO0FBR0YsOEVBQThFO0FBQzlFLG9CQUEyQixJQUFlO0lBRXRDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsUUFBUSxDQUFDLFdBQVcsRUFBRTtTQUNqQixJQUFJLENBQUMsVUFBQSxVQUFVO1FBQ1osTUFBTSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUEsT0FBTztZQUN6RCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNWLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUMxQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLEVBQUUsVUFBQSxLQUFLO1FBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBR1AsK0VBQStFO0lBQy9FLHdFQUF3RTtJQUN4RSw4QkFBOEI7SUFDOUIsOEJBQThCO0lBQzlCLDJCQUEyQjtBQUMvQixDQUFDO0FBcEJELGdDQW9CQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICdkYXRhL29ic2VydmFibGUtYXJyYXknO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuXG5pbXBvcnQgeyBGcmllbmQgfSBmcm9tICcuLi8uLi9kYXRhL2FwcC1kYXRhLW1vZGVsJztcbmltcG9ydCAqIGFzIGFwcFN0b3JlIGZyb20gJy4uLy4uL2RhdGEvYXBwLXN0b3JlJztcbmltcG9ydCB7IG5hdmlnYXRlVG8gfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG5cbmltcG9ydCAqIGFzIG5vdGlmeSBmcm9tICcuLi8uLi9kYXRhL25vdGlmaWNhdGlvbic7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHVibGljIG15RnJpZW5kczogT2JzZXJ2YWJsZUFycmF5PE9iamVjdD47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLm15RnJpZW5kcyA9IG5ldyBPYnNlcnZhYmxlQXJyYXkoW10pO1xuXG4gICAgICAgIG5vdGlmeS5ub3RpZmljYXRpb25MaXN0ZW5lckluaXQoKTtcbiAgICAgICAgbm90aWZ5LnNjaGVkdWxlQWxlcnQoKTtcblxuICAgICAgICB0aGlzLnBvcHVsYXRlRnJpZW5kc0xpc3QoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHBvcHVsYXRlRnJpZW5kc0xpc3QoKSB7XG4gICAgICAgIGFwcFN0b3JlLmdldEZyaWVuZHNMaXN0KClcbiAgICAgICAgICAgIC50aGVuKGZyaWVuZHNMaXN0ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCgnbXlGcmllbmRzJywgZnJpZW5kc0xpc3QpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgcHVibGljIGFkZEZyaWVuZCgpIHtcbiAgICAgICAgYXBwU3RvcmUuYWRkRnJpZW5kKCdhZGQgdGVzdCBmcmllbmQnKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb1RvU2V0dGluZ3MoYXJnczogRXZlbnREYXRhKSB7XG4gICAgICAgIG5hdmlnYXRlVG8oJ3NldHRpbmdzLXBhZ2UnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29Ub0NoYXQoYXJncykge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdjaGF0LXBhZ2UnLCB0aGlzLm15RnJpZW5kc1thcmdzLmluZGV4XS5fdGl0bGUpO1xuICAgIH1cbn07XG5cblxuLy8gaW5pdCB0aGUgRnJpZW5kcyBkYXRhIGZyb20gdGhlIGFwcFN0b3JlIGFuZCBiaW5kIHRoZSBQYWdlTW9kZWwgdG8gdGhlIHBhZ2U7XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcblxuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgYXBwU3RvcmUuaW5pdEFwcERhdGEoKVxuICAgICAgICAudGhlbihsb2dNZXNzYWdlID0+IHtcbiAgICAgICAgICAgIG5vdGlmeS5Mb2NhbE5vdGlmaWNhdGlvbnNSZWYucmVxdWVzdFBlcm1pc3Npb24oKS50aGVuKGdyYW50ZWQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChncmFudGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgfSk7XG5cblxuICAgIC8vIC8vIFRoaXMgbWFrZXMgdGhlIHBob25lIFN0YXR1cyBCYXIgdGhlIHNhbWUgY29sb3IgYXMgdGhlIGFwcCBBY3Rpb24gQmFyICg/PylcbiAgICAvLyBpbXBvcnQgeyBzZXRTdGF0dXNCYXJDb2xvcnNJT1MgfSBmcm9tICcuLi8uLi9zaGFyZWQvc3RhdHVzLWJhci11dGlsJztcbiAgICAvLyBwYWdlLnN0eWxlLm1hcmdpblRvcCA9IC0yMDtcbiAgICAvLyBwYWdlLnN0eWxlLnBhZGRpbmdUb3AgPSAyMDtcbiAgICAvLyBzZXRTdGF0dXNCYXJDb2xvcnNJT1MoKTtcbn0iXX0=