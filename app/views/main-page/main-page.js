"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
        appStore.addFriend('Squaaaashh')
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
    appStore.initAppData()
        .then(function (logMessage) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUF3RDtBQUN4RCwwREFBd0Q7QUFLeEQsK0NBQWlEO0FBQ2pELHVEQUFrRDtBQUVsRDtJQUF3Qiw2QkFBVTtJQUk5QjtRQUFBLFlBQ0ksaUJBQU8sU0FLVjtRQUhHLEtBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxrQ0FBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXpDLEtBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDOztJQUMvQixDQUFDO0lBRU8sdUNBQW1CLEdBQTNCO1FBQUEsaUJBT0M7UUFORyxRQUFRLENBQUMsY0FBYyxFQUFFO2FBQ3BCLElBQUksQ0FBQyxVQUFBLFdBQVc7WUFDYixLQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN2QyxDQUFDLEVBQUUsVUFBQSxLQUFLO1lBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUdNLDZCQUFTLEdBQWhCO1FBQUEsaUJBT0M7UUFORyxRQUFRLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQzthQUMzQixJQUFJLENBQUM7WUFDRixLQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUMvQixDQUFDLEVBQUUsVUFBQSxLQUFLO1lBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVNLGdDQUFZLEdBQW5CLFVBQW9CLElBQWU7UUFDL0IsMkJBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRU0sNEJBQVEsR0FBZixVQUFnQixJQUFJO1FBQ2hCLDJCQUFVLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUF0Q0QsQ0FBd0IsdUJBQVUsR0FzQ2pDO0FBQUEsQ0FBQztBQUdGLDhFQUE4RTtBQUM5RSxvQkFBMkIsSUFBZTtJQUV0QyxJQUFJLElBQUksR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdCLFFBQVEsQ0FBQyxXQUFXLEVBQUU7U0FDakIsSUFBSSxDQUFDLFVBQUEsVUFBVTtRQUNaLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztJQUMxQyxDQUFDLEVBQUUsVUFBQSxLQUFLO1FBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBR1AsK0VBQStFO0lBQy9FLHdFQUF3RTtJQUN4RSw4QkFBOEI7SUFDOUIsOEJBQThCO0lBQzlCLDJCQUEyQjtBQUMvQixDQUFDO0FBaEJELGdDQWdCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICdkYXRhL29ic2VydmFibGUtYXJyYXknO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuXG5pbXBvcnQgeyBGcmllbmQgfSBmcm9tICcuLi8uLi9kYXRhL2FwcC1kYXRhLW1vZGVsJztcbmltcG9ydCAqIGFzIGFwcFN0b3JlIGZyb20gJy4uLy4uL2RhdGEvYXBwLXN0b3JlJztcbmltcG9ydCB7IG5hdmlnYXRlVG8gfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHVibGljIG15RnJpZW5kczogT2JzZXJ2YWJsZUFycmF5PE9iamVjdD47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLm15RnJpZW5kcyA9IG5ldyBPYnNlcnZhYmxlQXJyYXkoW10pO1xuXG4gICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcG9wdWxhdGVGcmllbmRzTGlzdCgpIHtcbiAgICAgICAgYXBwU3RvcmUuZ2V0RnJpZW5kc0xpc3QoKVxuICAgICAgICAgICAgLnRoZW4oZnJpZW5kc0xpc3QgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdteUZyaWVuZHMnLCBmcmllbmRzTGlzdCk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgYWRkRnJpZW5kKCkge1xuICAgICAgICBhcHBTdG9yZS5hZGRGcmllbmQoJ1NxdWFhYWFzaGgnKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnb1RvU2V0dGluZ3MoYXJnczogRXZlbnREYXRhKSB7XG4gICAgICAgIG5hdmlnYXRlVG8oJ3NldHRpbmdzLXBhZ2UnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29Ub0NoYXQoYXJncykge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdjaGF0LXBhZ2UnLCB0aGlzLm15RnJpZW5kc1thcmdzLmluZGV4XS5faWQpO1xuICAgIH1cbn07XG5cblxuLy8gaW5pdCB0aGUgRnJpZW5kcyBkYXRhIGZyb20gdGhlIGFwcFN0b3JlIGFuZCBiaW5kIHRoZSBQYWdlTW9kZWwgdG8gdGhlIHBhZ2U7XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcblxuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgYXBwU3RvcmUuaW5pdEFwcERhdGEoKVxuICAgICAgICAudGhlbihsb2dNZXNzYWdlID0+IHtcbiAgICAgICAgICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKCk7XG4gICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgfSk7XG5cblxuICAgIC8vIC8vIFRoaXMgbWFrZXMgdGhlIHBob25lIFN0YXR1cyBCYXIgdGhlIHNhbWUgY29sb3IgYXMgdGhlIGFwcCBBY3Rpb24gQmFyICg/PylcbiAgICAvLyBpbXBvcnQgeyBzZXRTdGF0dXNCYXJDb2xvcnNJT1MgfSBmcm9tICcuLi8uLi9zaGFyZWQvc3RhdHVzLWJhci11dGlsJztcbiAgICAvLyBwYWdlLnN0eWxlLm1hcmdpblRvcCA9IC0yMDtcbiAgICAvLyBwYWdlLnN0eWxlLnBhZGRpbmdUb3AgPSAyMDtcbiAgICAvLyBzZXRTdGF0dXNCYXJDb2xvcnNJT1MoKTtcbn1cbiJdfQ==