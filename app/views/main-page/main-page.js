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
        appStore.addFriend('Name of Friend to Test 3')
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
        app_navigation_1.navigateTo('chat-page', args.index.toString());
    };
    return PageModel;
}(observable_1.Observable));
;
// init the Friends data from the appStore and bind the PageModel to the page;
function pageLoaded(args) {
    var page = args.object;
    appStore.initAppData()
        .then(function (logMessage) {
        console.log(logMessage);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBS3hELCtDQUFpRDtBQUNqRCx1REFBa0Q7QUFFbEQ7SUFBd0IsNkJBQVU7SUFJOUI7UUFBQSxZQUNJLGlCQUFPLFNBS1Y7UUFIRyxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksa0NBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV6QyxLQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzs7SUFDL0IsQ0FBQztJQUVPLHVDQUFtQixHQUEzQjtRQUFBLGlCQU9DO1FBTkcsUUFBUSxDQUFDLGNBQWMsRUFBRTthQUNwQixJQUFJLENBQUMsVUFBQSxXQUFXO1lBQ2IsS0FBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxFQUFFLFVBQUEsS0FBSztZQUNKLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFHTSw2QkFBUyxHQUFoQjtRQUFBLGlCQU9DO1FBTkcsUUFBUSxDQUFDLFNBQVMsQ0FBQywwQkFBMEIsQ0FBQzthQUN6QyxJQUFJLENBQUM7WUFDRixLQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUMvQixDQUFDLEVBQUUsVUFBQSxLQUFLO1lBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGdDQUFZLEdBQW5CLFVBQW9CLElBQWU7UUFDL0IsMkJBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRU0sNEJBQVEsR0FBZixVQUFnQixJQUFJO1FBQ2hCLDJCQUFVLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBdENELENBQXdCLHVCQUFVLEdBc0NqQztBQUFBLENBQUM7QUFFRiw4RUFBOEU7QUFDOUUsb0JBQTJCLElBQWU7SUFFdEMsSUFBSSxJQUFJLEdBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUM3QixRQUFRLENBQUMsV0FBVyxFQUFFO1NBQ2pCLElBQUksQ0FBQyxVQUFBLFVBQVU7UUFDWixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztJQUMxQyxDQUFDLEVBQUUsVUFBQSxLQUFLO1FBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBR1AsK0VBQStFO0lBQy9FLHdFQUF3RTtJQUN4RSw4QkFBOEI7SUFDOUIsOEJBQThCO0lBQzlCLDJCQUEyQjtBQUMvQixDQUFDO0FBakJELGdDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICdkYXRhL29ic2VydmFibGUtYXJyYXknO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuXG5pbXBvcnQgeyBGcmllbmQgfSBmcm9tICcuLi8uLi9kYXRhL2FwcC1kYXRhLW1vZGVsJztcbmltcG9ydCAqIGFzIGFwcFN0b3JlIGZyb20gJy4uLy4uL2RhdGEvYXBwLXN0b3JlJztcbmltcG9ydCB7IG5hdmlnYXRlVG8gfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHVibGljIG15RnJpZW5kczogT2JzZXJ2YWJsZUFycmF5PE9iamVjdD47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLm15RnJpZW5kcyA9IG5ldyBPYnNlcnZhYmxlQXJyYXkoW10pO1xuXG4gICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcG9wdWxhdGVGcmllbmRzTGlzdCgpIHtcbiAgICAgICAgYXBwU3RvcmUuZ2V0RnJpZW5kc0xpc3QoKVxuICAgICAgICAgICAgLnRoZW4oZnJpZW5kc0xpc3QgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdteUZyaWVuZHMnLCBmcmllbmRzTGlzdCk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgYWRkRnJpZW5kKCkge1xuICAgICAgICBhcHBTdG9yZS5hZGRGcmllbmQoJ05hbWUgb2YgRnJpZW5kIHRvIFRlc3QgMycpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1bGF0ZUZyaWVuZHNMaXN0KCk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdvVG9TZXR0aW5ncyhhcmdzOiBFdmVudERhdGEpIHtcbiAgICAgICAgbmF2aWdhdGVUbygnc2V0dGluZ3MtcGFnZScpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb1RvQ2hhdChhcmdzKSB7XG4gICAgICAgIG5hdmlnYXRlVG8oJ2NoYXQtcGFnZScsIGFyZ3MuaW5kZXgudG9TdHJpbmcoKSk7XG4gICAgfVxufTtcblxuLy8gaW5pdCB0aGUgRnJpZW5kcyBkYXRhIGZyb20gdGhlIGFwcFN0b3JlIGFuZCBiaW5kIHRoZSBQYWdlTW9kZWwgdG8gdGhlIHBhZ2U7XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcblxuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgYXBwU3RvcmUuaW5pdEFwcERhdGEoKVxuICAgICAgICAudGhlbihsb2dNZXNzYWdlID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGxvZ01lc3NhZ2UpO1xuICAgICAgICAgICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWwoKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICB9KTtcblxuXG4gICAgLy8gLy8gVGhpcyBtYWtlcyB0aGUgcGhvbmUgU3RhdHVzIEJhciB0aGUgc2FtZSBjb2xvciBhcyB0aGUgYXBwIEFjdGlvbiBCYXIgKD8/KVxuICAgIC8vIGltcG9ydCB7IHNldFN0YXR1c0JhckNvbG9yc0lPUyB9IGZyb20gJy4uLy4uL3NoYXJlZC9zdGF0dXMtYmFyLXV0aWwnO1xuICAgIC8vIHBhZ2Uuc3R5bGUubWFyZ2luVG9wID0gLTIwO1xuICAgIC8vIHBhZ2Uuc3R5bGUucGFkZGluZ1RvcCA9IDIwO1xuICAgIC8vIHNldFN0YXR1c0JhckNvbG9yc0lPUygpO1xufVxuIl19