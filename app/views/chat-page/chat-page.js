"use strict";
var observable_1 = require("data/observable");
var app_navigation_1 = require("../../app-navigation");
var timer = require("timer");
var appStore = require("../../data/app-store");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
        _this.newMessageText = '';
        _this.getPageData();
        _this.scrollMessagesList();
        return _this;
    }
    PageModel.prototype.getPageData = function () {
        var friendRef = this.pageRef.navigationContext.chatRef;
        var thisChatFriend = appStore.getFriend(friendRef);
        this.set('thisFriend', thisChatFriend);
    };
    PageModel.prototype.reScrollWithDelay = function () {
        var _this = this;
        timer.setTimeout(function () {
            _this.scrollMessagesList();
        }, 800);
    };
    PageModel.prototype.goBack = function () {
        app_navigation_1.navigateBack();
    };
    PageModel.prototype.scrollMessagesList = function () {
        var listViewRef = this.pageRef.getViewById('messagesList');
        listViewRef.android.smoothScrollToPosition(this.thisFriend.messages.length - 1);
    };
    PageModel.prototype.sendMessage = function () {
        var _this = this;
        if (this.newMessageText) {
            appStore.sendMessage(this.thisFriend._id, this.newMessageText)
                .then(function () {
                _this.set('newMessageText', '');
                _this.getPageData();
                _this.reScrollWithDelay();
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
    page.bindingContext = new PageModel(page);
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFHeEQsdURBQW9EO0FBQ3BELDZCQUErQjtBQUUvQiwrQ0FBaUQ7QUFFakQ7SUFBd0IsNkJBQVU7SUFNOUIsbUJBQVksT0FBWTtRQUF4QixZQUNJLGlCQUFPLFNBS1Y7UUFKRyxLQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixLQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN6QixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsS0FBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7O0lBQzlCLENBQUM7SUFFTywrQkFBVyxHQUFuQjtRQUNJLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDO1FBQ3ZELElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVNLHFDQUFpQixHQUF4QjtRQUFBLGlCQUlDO1FBSEcsS0FBSyxDQUFDLFVBQVUsQ0FBQztZQUNiLEtBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzlCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFTSwwQkFBTSxHQUFiO1FBQ0ksNkJBQVksRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFTSxzQ0FBa0IsR0FBekI7UUFDSSxJQUFJLFdBQVcsR0FBYSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNyRSxXQUFXLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRU0sK0JBQVcsR0FBbEI7UUFBQSxpQkFTQztRQVJHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQztpQkFDekQsSUFBSSxDQUFDO2dCQUNGLEtBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQy9CLEtBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbkIsS0FBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDO0lBQ0wsQ0FBQztJQUVNLGdDQUFZLEdBQW5CO1FBQ0ksNkJBQVksRUFBRSxDQUFDO1FBQ2YsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUFsREQsQ0FBd0IsdUJBQVUsR0FrRGpDO0FBRUQseUNBQXlDO0FBQ3pDLG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBSEQsZ0NBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEsIE9ic2VydmFibGUgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuaW1wb3J0IHsgbmF2aWdhdGVCYWNrIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuaW1wb3J0ICogYXMgdGltZXIgZnJvbSAndGltZXInO1xuXG5pbXBvcnQgKiBhcyBhcHBTdG9yZSBmcm9tICcuLi8uLi9kYXRhL2FwcC1zdG9yZSc7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHJpdmF0ZSB0aGlzRnJpZW5kOiBhbnk7XG4gICAgcHJpdmF0ZSBwYWdlUmVmOiBhbnk7XG4gICAgcHVibGljIG5ld01lc3NhZ2VUZXh0OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihwYWdlUmVmOiBhbnkpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wYWdlUmVmID0gcGFnZVJlZjtcbiAgICAgICAgdGhpcy5uZXdNZXNzYWdlVGV4dCA9ICcnO1xuICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsTWVzc2FnZXNMaXN0KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRQYWdlRGF0YSgpIHtcbiAgICAgICAgdmFyIGZyaWVuZFJlZiA9IHRoaXMucGFnZVJlZi5uYXZpZ2F0aW9uQ29udGV4dC5jaGF0UmVmO1xuICAgICAgICB2YXIgdGhpc0NoYXRGcmllbmQgPSBhcHBTdG9yZS5nZXRGcmllbmQoZnJpZW5kUmVmKTtcbiAgICAgICAgdGhpcy5zZXQoJ3RoaXNGcmllbmQnLCB0aGlzQ2hhdEZyaWVuZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlU2Nyb2xsV2l0aERlbGF5KCkge1xuICAgICAgICB0aW1lci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWVzc2FnZXNMaXN0KCk7XG4gICAgICAgIH0sIDgwMCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdvQmFjaygpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNjcm9sbE1lc3NhZ2VzTGlzdCgpIHtcbiAgICAgICAgdmFyIGxpc3RWaWV3UmVmID0gPExpc3RWaWV3PnRoaXMucGFnZVJlZi5nZXRWaWV3QnlJZCgnbWVzc2FnZXNMaXN0Jyk7XG4gICAgICAgIGxpc3RWaWV3UmVmLmFuZHJvaWQuc21vb3RoU2Nyb2xsVG9Qb3NpdGlvbih0aGlzLnRoaXNGcmllbmQubWVzc2FnZXMubGVuZ3RoIC0gMSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNlbmRNZXNzYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5uZXdNZXNzYWdlVGV4dCkge1xuICAgICAgICAgICAgYXBwU3RvcmUuc2VuZE1lc3NhZ2UodGhpcy50aGlzRnJpZW5kLl9pZCwgdGhpcy5uZXdNZXNzYWdlVGV4dClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCduZXdNZXNzYWdlVGV4dCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlU2Nyb2xsV2l0aERlbGF5KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlRnJpZW5kKCkge1xuICAgICAgICBuYXZpZ2F0ZUJhY2soKTtcbiAgICAgICAgYXBwU3RvcmUucmVtb3ZlRnJpZW5kKHRoaXMudGhpc0ZyaWVuZC5faWQpO1xuICAgIH1cbn1cblxuLy8gTW91bnQgdGhlIFBhZ2UgTW9kZWwgb250byB0aGUgeG1sIFZpZXdcbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWwocGFnZSk7XG59Il19