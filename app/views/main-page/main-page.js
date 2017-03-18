"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var app_data_model_1 = require("../../app-data-model");
var app_navigation_1 = require("../../app-navigation");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel() {
        var _this = _super.call(this) || this;
        // initialise Observables
        _this.myFriends = new observable_array_1.ObservableArray([
            new app_data_model_1.Friend('First Friend'),
            new app_data_model_1.Friend('Second Friend')
        ]);
        return _this;
    }
    // define Actions on the model / Observables here    
    PageModel.prototype.addFriend = function () {
        this.myFriends.push(new app_data_model_1.Friend('New Test Friend'));
    };
    PageModel.prototype.goToSettings = function (args) {
        app_navigation_1.navigateTo('settings-page');
    };
    PageModel.prototype.goToChat = function (args) {
        var chatTitle = this.myFriends.getItem(args.index).nickname;
        app_navigation_1.navigateTo('chat-page', chatTitle);
    };
    return PageModel;
}(observable_1.Observable));
;
// bind the Page template to the Data Model from above
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel;
    // This makes the phone Status Bar the same color as the app Action Bar (??)
    // page.style.marginTop = -20;
    // page.style.paddingTop = 20;
    // setStatusBarColorsIOS();
}
exports.pageLoaded = pageLoaded;
// add generic Page functionality
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBSXhELHVEQUE4QztBQUM5Qyx1REFBa0Q7QUFJbEQ7SUFBd0IsNkJBQVU7SUFLOUI7UUFBQSxZQUNJLGlCQUFPLFNBTVY7UUFMRyx5QkFBeUI7UUFDekIsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGtDQUFlLENBQVM7WUFDekMsSUFBSSx1QkFBTSxDQUFDLGNBQWMsQ0FBQztZQUMxQixJQUFJLHVCQUFNLENBQUMsZUFBZSxDQUFDO1NBQzlCLENBQUMsQ0FBQzs7SUFDUCxDQUFDO0lBRUQscURBQXFEO0lBQzlDLDZCQUFTLEdBQWhCO1FBQ0ksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSx1QkFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsZ0NBQVksR0FBWixVQUFhLElBQWU7UUFDeEIsMkJBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsNEJBQVEsR0FBUixVQUFTLElBQUk7UUFDVCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQzVELDJCQUFVLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUEzQkQsQ0FBd0IsdUJBQVUsR0EyQmpDO0FBQUEsQ0FBQztBQUVGLHNEQUFzRDtBQUN0RCxvQkFBMkIsSUFBZTtJQUN0QyxJQUFJLElBQUksR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLENBQUM7SUFFcEMsNEVBQTRFO0lBQzVFLDhCQUE4QjtJQUM5Qiw4QkFBOEI7SUFDOUIsMkJBQTJCO0FBQy9CLENBQUM7QUFSRCxnQ0FRQztBQUVELGlDQUFpQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlQXJyYXkgfSBmcm9tICdkYXRhL29ic2VydmFibGUtYXJyYXknO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0IHsgTGlzdFZpZXcgfSBmcm9tICd1aS9saXN0LXZpZXcnO1xuXG5pbXBvcnQgeyBGcmllbmQgfSBmcm9tICcuLi8uLi9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgeyBuYXZpZ2F0ZVRvIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuXG5pbXBvcnQgeyBzZXRTdGF0dXNCYXJDb2xvcnNJT1MgfSBmcm9tICcuLi8uLi9zaGFyZWQvc3RhdHVzLWJhci11dGlsJztcblxuY2xhc3MgUGFnZU1vZGVsIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG5cbiAgICAvLyBkZWZpbmUgT2JzZXJ2YWJsZXMgICAgXG4gICAgcHVibGljIG15RnJpZW5kczogT2JzZXJ2YWJsZUFycmF5PEZyaWVuZD5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvLyBpbml0aWFsaXNlIE9ic2VydmFibGVzXG4gICAgICAgIHRoaXMubXlGcmllbmRzID0gbmV3IE9ic2VydmFibGVBcnJheTxGcmllbmQ+KFtcbiAgICAgICAgICAgIG5ldyBGcmllbmQoJ0ZpcnN0IEZyaWVuZCcpLFxuICAgICAgICAgICAgbmV3IEZyaWVuZCgnU2Vjb25kIEZyaWVuZCcpXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8vIGRlZmluZSBBY3Rpb25zIG9uIHRoZSBtb2RlbCAvIE9ic2VydmFibGVzIGhlcmUgICAgXG4gICAgcHVibGljIGFkZEZyaWVuZCgpIHtcbiAgICAgICAgdGhpcy5teUZyaWVuZHMucHVzaChuZXcgRnJpZW5kKCdOZXcgVGVzdCBGcmllbmQnKSk7XG4gICAgfVxuXG4gICAgZ29Ub1NldHRpbmdzKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdzZXR0aW5ncy1wYWdlJyk7XG4gICAgfVxuXG4gICAgZ29Ub0NoYXQoYXJncykge1xuICAgICAgICB2YXIgY2hhdFRpdGxlID0gdGhpcy5teUZyaWVuZHMuZ2V0SXRlbShhcmdzLmluZGV4KS5uaWNrbmFtZTtcbiAgICAgICAgbmF2aWdhdGVUbygnY2hhdC1wYWdlJywgY2hhdFRpdGxlKTtcbiAgICB9XG59O1xuXG4vLyBiaW5kIHRoZSBQYWdlIHRlbXBsYXRlIHRvIHRoZSBEYXRhIE1vZGVsIGZyb20gYWJvdmVcbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWw7XG5cbiAgICAvLyBUaGlzIG1ha2VzIHRoZSBwaG9uZSBTdGF0dXMgQmFyIHRoZSBzYW1lIGNvbG9yIGFzIHRoZSBhcHAgQWN0aW9uIEJhciAoPz8pXG4gICAgLy8gcGFnZS5zdHlsZS5tYXJnaW5Ub3AgPSAtMjA7XG4gICAgLy8gcGFnZS5zdHlsZS5wYWRkaW5nVG9wID0gMjA7XG4gICAgLy8gc2V0U3RhdHVzQmFyQ29sb3JzSU9TKCk7XG59XG5cbi8vIGFkZCBnZW5lcmljIFBhZ2UgZnVuY3Rpb25hbGl0eVxuIl19