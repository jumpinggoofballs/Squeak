"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel() {
        var _this = _super.call(this) || this;
        _this.myFriends = new observable_array_1.ObservableArray();
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
        appStore.addFriend('Name of Friend to Test')
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
        var chatTitle = this.myFriends[args.index].nickname;
        app_navigation_1.navigateTo('chat-page', chatTitle);
    };
    return PageModel;
}(observable_1.Observable));
;
// init the Friends data from the appStore and bind the PageModel to the page;
function pageLoaded(args) {
    var page = args.object;
    appStore.initFriendsData()
        .then(function () {
        page.bindingContext = new PageModel();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBS3hELCtDQUFpRDtBQUNqRCx1REFBa0Q7QUFFbEQ7SUFBd0IsNkJBQVU7SUFJOUI7UUFBQSxZQUNJLGlCQUFPLFNBS1Y7UUFIRyxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksa0NBQWUsRUFBRSxDQUFDO1FBRXZDLEtBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDOztJQUMvQixDQUFDO0lBRU8sdUNBQW1CLEdBQTNCO1FBQUEsaUJBT0M7UUFORyxRQUFRLENBQUMsY0FBYyxFQUFFO2FBQ3BCLElBQUksQ0FBQyxVQUFBLFdBQVc7WUFDYixLQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN2QyxDQUFDLEVBQUUsVUFBQSxLQUFLO1lBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUdNLDZCQUFTLEdBQWhCO1FBQUEsaUJBT0M7UUFORyxRQUFRLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDO2FBQ3ZDLElBQUksQ0FBQztZQUNGLEtBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQy9CLENBQUMsRUFBRSxVQUFBLEtBQUs7WUFDSixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU0sZ0NBQVksR0FBbkIsVUFBb0IsSUFBZTtRQUMvQiwyQkFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSw0QkFBUSxHQUFmLFVBQWdCLElBQUk7UUFDaEIsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ3BELDJCQUFVLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUF2Q0QsQ0FBd0IsdUJBQVUsR0F1Q2pDO0FBQUEsQ0FBQztBQUVGLDhFQUE4RTtBQUM5RSxvQkFBMkIsSUFBZTtJQUV0QyxJQUFJLElBQUksR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdCLFFBQVEsQ0FBQyxlQUFlLEVBQUU7U0FDckIsSUFBSSxDQUFDO1FBQ0YsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO0lBQzFDLENBQUMsRUFBRSxVQUFBLEtBQUs7UUFDSixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakIsQ0FBQyxDQUFDLENBQUM7SUFHUCwrRUFBK0U7SUFDL0Usd0VBQXdFO0lBQ3hFLDhCQUE4QjtJQUM5Qiw4QkFBOEI7SUFDOUIsMkJBQTJCO0FBQy9CLENBQUM7QUFoQkQsZ0NBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnREYXRhLCBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcbmltcG9ydCB7IE9ic2VydmFibGVBcnJheSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZS1hcnJheSc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAndWkvcGFnZSc7XG5pbXBvcnQgeyBMaXN0VmlldyB9IGZyb20gJ3VpL2xpc3Qtdmlldyc7XG5cbmltcG9ydCB7IEZyaWVuZCB9IGZyb20gJy4uLy4uL2RhdGEvYXBwLWRhdGEtbW9kZWwnO1xuaW1wb3J0ICogYXMgYXBwU3RvcmUgZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuaW1wb3J0IHsgbmF2aWdhdGVUbyB9IGZyb20gJy4uLy4uL2FwcC1uYXZpZ2F0aW9uJztcblxuY2xhc3MgUGFnZU1vZGVsIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG5cbiAgICBwdWJsaWMgbXlGcmllbmRzOiBPYnNlcnZhYmxlQXJyYXk8T2JqZWN0PjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMubXlGcmllbmRzID0gbmV3IE9ic2VydmFibGVBcnJheSgpO1xuXG4gICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcG9wdWxhdGVGcmllbmRzTGlzdCgpIHtcbiAgICAgICAgYXBwU3RvcmUuZ2V0RnJpZW5kc0xpc3QoKVxuICAgICAgICAgICAgLnRoZW4oZnJpZW5kc0xpc3QgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdteUZyaWVuZHMnLCBmcmllbmRzTGlzdCk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgYWRkRnJpZW5kKCkge1xuICAgICAgICBhcHBTdG9yZS5hZGRGcmllbmQoJ05hbWUgb2YgRnJpZW5kIHRvIFRlc3QnKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb1RvU2V0dGluZ3MoYXJnczogRXZlbnREYXRhKSB7XG4gICAgICAgIG5hdmlnYXRlVG8oJ3NldHRpbmdzLXBhZ2UnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29Ub0NoYXQoYXJncykge1xuICAgICAgICB2YXIgY2hhdFRpdGxlID0gdGhpcy5teUZyaWVuZHNbYXJncy5pbmRleF0ubmlja25hbWU7XG4gICAgICAgIG5hdmlnYXRlVG8oJ2NoYXQtcGFnZScsIGNoYXRUaXRsZSk7XG4gICAgfVxufTtcblxuLy8gaW5pdCB0aGUgRnJpZW5kcyBkYXRhIGZyb20gdGhlIGFwcFN0b3JlIGFuZCBiaW5kIHRoZSBQYWdlTW9kZWwgdG8gdGhlIHBhZ2U7XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcblxuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgYXBwU3RvcmUuaW5pdEZyaWVuZHNEYXRhKClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWwoKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICB9KTtcblxuXG4gICAgLy8gLy8gVGhpcyBtYWtlcyB0aGUgcGhvbmUgU3RhdHVzIEJhciB0aGUgc2FtZSBjb2xvciBhcyB0aGUgYXBwIEFjdGlvbiBCYXIgKD8/KVxuICAgIC8vIGltcG9ydCB7IHNldFN0YXR1c0JhckNvbG9yc0lPUyB9IGZyb20gJy4uLy4uL3NoYXJlZC9zdGF0dXMtYmFyLXV0aWwnO1xuICAgIC8vIHBhZ2Uuc3R5bGUubWFyZ2luVG9wID0gLTIwO1xuICAgIC8vIHBhZ2Uuc3R5bGUucGFkZGluZ1RvcCA9IDIwO1xuICAgIC8vIHNldFN0YXR1c0JhckNvbG9yc0lPUygpO1xufVxuIl19