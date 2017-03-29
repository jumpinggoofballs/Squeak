"use strict";
var observable_1 = require("data/observable");
var app_navigation_1 = require("../../app-navigation");
var appStore = require("../../data/app-store");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
        _this.newMessageText = '';
        _this.getPageData();
        return _this;
    }
    PageModel.prototype.getPageData = function () {
        var friendRef = this.pageRef.navigationContext.chatRef;
        var thisChatFriend = appStore.getFriend(friendRef);
        this.set('thisFriend', thisChatFriend);
        this.scrollMessagesList();
    };
    PageModel.prototype.alert = function () {
        alert('hello');
    };
    PageModel.prototype.goBack = function () {
        app_navigation_1.navigateBack();
    };
    PageModel.prototype.scrollMessagesList = function () {
        var listViewRef = this.pageRef.getViewById('messagesList');
        listViewRef.scrollToIndex(this.thisFriend.messages.length - 1);
    };
    PageModel.prototype.sendMessage = function () {
        var _this = this;
        if (this.newMessageText) {
            appStore.sendMessage(this.thisFriend._id, this.newMessageText)
                .then(function () {
                _this.set('newMessageText', '');
                _this.getPageData();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhdC1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFHeEQsdURBQW9EO0FBRXBELCtDQUFpRDtBQUVqRDtJQUF3Qiw2QkFBVTtJQU05QixtQkFBWSxPQUFZO1FBQXhCLFlBQ0ksaUJBQU8sU0FJVjtRQUhHLEtBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLEtBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLEtBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7SUFDdkIsQ0FBQztJQUVPLCtCQUFXLEdBQW5CO1FBQ0ksSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7UUFDdkQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRU0seUJBQUssR0FBWjtRQUNJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRU0sMEJBQU0sR0FBYjtRQUNJLDZCQUFZLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRU0sc0NBQWtCLEdBQXpCO1FBQ0ksSUFBSSxXQUFXLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDckUsV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVNLCtCQUFXLEdBQWxCO1FBQUEsaUJBUUM7UUFQRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUN0QixRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUM7aUJBQ3pELElBQUksQ0FBQztnQkFDRixLQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQixLQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDO0lBQ0wsQ0FBQztJQUVNLGdDQUFZLEdBQW5CO1FBQ0ksNkJBQVksRUFBRSxDQUFDO1FBQ2YsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUEvQ0QsQ0FBd0IsdUJBQVUsR0ErQ2pDO0FBRUQseUNBQXlDO0FBQ3pDLG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBSEQsZ0NBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEsIE9ic2VydmFibGUgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuaW1wb3J0IHsgbmF2aWdhdGVCYWNrIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuXG5pbXBvcnQgKiBhcyBhcHBTdG9yZSBmcm9tICcuLi8uLi9kYXRhL2FwcC1zdG9yZSc7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHJpdmF0ZSB0aGlzRnJpZW5kOiBhbnk7XG4gICAgcHJpdmF0ZSBwYWdlUmVmOiBhbnk7XG4gICAgcHVibGljIG5ld01lc3NhZ2VUZXh0OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihwYWdlUmVmOiBhbnkpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wYWdlUmVmID0gcGFnZVJlZjtcbiAgICAgICAgdGhpcy5uZXdNZXNzYWdlVGV4dCA9ICcnO1xuICAgICAgICB0aGlzLmdldFBhZ2VEYXRhKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRQYWdlRGF0YSgpIHtcbiAgICAgICAgdmFyIGZyaWVuZFJlZiA9IHRoaXMucGFnZVJlZi5uYXZpZ2F0aW9uQ29udGV4dC5jaGF0UmVmO1xuICAgICAgICB2YXIgdGhpc0NoYXRGcmllbmQgPSBhcHBTdG9yZS5nZXRGcmllbmQoZnJpZW5kUmVmKTtcbiAgICAgICAgdGhpcy5zZXQoJ3RoaXNGcmllbmQnLCB0aGlzQ2hhdEZyaWVuZCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsTWVzc2FnZXNMaXN0KCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFsZXJ0KCkge1xuICAgICAgICBhbGVydCgnaGVsbG8nKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ29CYWNrKCkge1xuICAgICAgICBuYXZpZ2F0ZUJhY2soKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2Nyb2xsTWVzc2FnZXNMaXN0KCkge1xuICAgICAgICB2YXIgbGlzdFZpZXdSZWYgPSA8TGlzdFZpZXc+dGhpcy5wYWdlUmVmLmdldFZpZXdCeUlkKCdtZXNzYWdlc0xpc3QnKTtcbiAgICAgICAgbGlzdFZpZXdSZWYuc2Nyb2xsVG9JbmRleCh0aGlzLnRoaXNGcmllbmQubWVzc2FnZXMubGVuZ3RoIC0gMSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNlbmRNZXNzYWdlKCkge1xuICAgICAgICBpZiAodGhpcy5uZXdNZXNzYWdlVGV4dCkge1xuICAgICAgICAgICAgYXBwU3RvcmUuc2VuZE1lc3NhZ2UodGhpcy50aGlzRnJpZW5kLl9pZCwgdGhpcy5uZXdNZXNzYWdlVGV4dClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCduZXdNZXNzYWdlVGV4dCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRQYWdlRGF0YSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZUZyaWVuZCgpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgICAgIGFwcFN0b3JlLnJlbW92ZUZyaWVuZCh0aGlzLnRoaXNGcmllbmQuX2lkKTtcbiAgICB9XG59XG5cbi8vIE1vdW50IHRoZSBQYWdlIE1vZGVsIG9udG8gdGhlIHhtbCBWaWV3XG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKHBhZ2UpO1xufSJdfQ==