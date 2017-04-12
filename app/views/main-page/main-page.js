"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
// import { cancelNotification } from '../../data/notification';
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
        _this.myFriends = new observable_array_1.ObservableArray([]);
        _this.populateFriendsList();
        pageRef.on('refreshData', function (args) {
            _this.populateFriendsList();
            // cancelNotification(args.object);         // also cancels when the app is minimised
        });
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
    return PageModel;
}(observable_1.Observable));
;
// init the Friends data from the appStore and bind the PageModel to the page;
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel(page);
}
exports.pageLoaded = pageLoaded;
function goToChat(args) {
    app_navigation_1.navigateTo('chat-page', args.object.itemRef);
}
exports.goToChat = goToChat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBS3hELCtDQUFpRDtBQUNqRCx1REFBa0Q7QUFDbEQsZ0VBQWdFO0FBRWhFO0lBQXdCLDZCQUFVO0lBSzlCLG1CQUFZLE9BQU87UUFBbkIsWUFDSSxpQkFBTyxTQVdWO1FBVEcsS0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGtDQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFekMsS0FBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFFM0IsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsVUFBQSxJQUFJO1lBQzFCLEtBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzNCLHFGQUFxRjtRQUN6RixDQUFDLENBQUMsQ0FBQzs7SUFDUCxDQUFDO0lBRU8sdUNBQW1CLEdBQTNCO1FBQUEsaUJBT0M7UUFORyxRQUFRLENBQUMsY0FBYyxFQUFFO2FBQ3BCLElBQUksQ0FBQyxVQUFBLFdBQVc7WUFDYixLQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN2QyxDQUFDLEVBQUUsVUFBQSxLQUFLO1lBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUdNLDZCQUFTLEdBQWhCO1FBQ0ksMkJBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxnQ0FBWSxHQUFuQixVQUFvQixJQUFlO1FBQy9CLDJCQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQU1MLGdCQUFDO0FBQUQsQ0FBQyxBQXpDRCxDQUF3Qix1QkFBVSxHQXlDakM7QUFBQSxDQUFDO0FBR0YsOEVBQThFO0FBQzlFLG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBSEQsZ0NBR0M7QUFFRCxrQkFBeUIsSUFBSTtJQUN6QiwyQkFBVSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFGRCw0QkFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICdkYXRhL29ic2VydmFibGUtYXJyYXknO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuXG5pbXBvcnQgeyBGcmllbmQgfSBmcm9tICcuLi8uLi9kYXRhL2FwcC1kYXRhLW1vZGVsJztcbmltcG9ydCAqIGFzIGFwcFN0b3JlIGZyb20gJy4uLy4uL2RhdGEvYXBwLXN0b3JlJztcbmltcG9ydCB7IG5hdmlnYXRlVG8gfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG4vLyBpbXBvcnQgeyBjYW5jZWxOb3RpZmljYXRpb24gfSBmcm9tICcuLi8uLi9kYXRhL25vdGlmaWNhdGlvbic7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHJpdmF0ZSBwYWdlUmVmO1xuICAgIHB1YmxpYyBteUZyaWVuZHM6IE9ic2VydmFibGVBcnJheTxPYmplY3Q+O1xuXG4gICAgY29uc3RydWN0b3IocGFnZVJlZikge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMucGFnZVJlZiA9IHBhZ2VSZWY7XG4gICAgICAgIHRoaXMubXlGcmllbmRzID0gbmV3IE9ic2VydmFibGVBcnJheShbXSk7XG5cbiAgICAgICAgdGhpcy5wb3B1bGF0ZUZyaWVuZHNMaXN0KCk7XG5cbiAgICAgICAgcGFnZVJlZi5vbigncmVmcmVzaERhdGEnLCBhcmdzID0+IHtcbiAgICAgICAgICAgIHRoaXMucG9wdWxhdGVGcmllbmRzTGlzdCgpO1xuICAgICAgICAgICAgLy8gY2FuY2VsTm90aWZpY2F0aW9uKGFyZ3Mub2JqZWN0KTsgICAgICAgICAvLyBhbHNvIGNhbmNlbHMgd2hlbiB0aGUgYXBwIGlzIG1pbmltaXNlZFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHBvcHVsYXRlRnJpZW5kc0xpc3QoKSB7XG4gICAgICAgIGFwcFN0b3JlLmdldEZyaWVuZHNMaXN0KClcbiAgICAgICAgICAgIC50aGVuKGZyaWVuZHNMaXN0ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCgnbXlGcmllbmRzJywgZnJpZW5kc0xpc3QpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgcHVibGljIGFkZEZyaWVuZCgpIHtcbiAgICAgICAgbmF2aWdhdGVUbygnYWRkLWZyaWVuZC1wYWdlJyk7XG4gICAgfVxuXG4gICAgcHVibGljIGdvVG9TZXR0aW5ncyhhcmdzOiBFdmVudERhdGEpIHtcbiAgICAgICAgbmF2aWdhdGVUbygnc2V0dGluZ3MtcGFnZScpO1xuICAgIH1cblxuICAgIC8vIExpc3RWaWV3Oml0ZW1UYXAgYW5kIEdyaWRWaWV3IGFyZSBub3QgcGxheWluZyBuaWNlbHkgd2l0aCBlYWNoIG90aGVyIHNvIHRoaXMgaGFzIGJlZW4gdGFrZW4gb3V0IG9mIGhlcmUgYW5kIGltcGxlbWVudGVkIGFzIGEgR3JpZFZpZXc6dGFwIFxuICAgIC8vIHB1YmxpYyBnb1RvQ2hhdChhcmdzKSB7XG4gICAgLy8gICAgIG5hdmlnYXRlVG8oJ2NoYXQtcGFnZScsIHRoaXMubXlGcmllbmRzW2FyZ3MuaW5kZXhdLl9pZCk7XG4gICAgLy8gfVxufTtcblxuXG4vLyBpbml0IHRoZSBGcmllbmRzIGRhdGEgZnJvbSB0aGUgYXBwU3RvcmUgYW5kIGJpbmQgdGhlIFBhZ2VNb2RlbCB0byB0aGUgcGFnZTtcbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWwocGFnZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnb1RvQ2hhdChhcmdzKSB7XG4gICAgbmF2aWdhdGVUbygnY2hhdC1wYWdlJywgYXJncy5vYmplY3QuaXRlbVJlZik7XG59Il19