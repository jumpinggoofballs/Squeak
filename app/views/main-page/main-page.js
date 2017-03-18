"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var app_data_model_1 = require("../../app-data-model");
var status_bar_util_1 = require("../../shared/status-bar-util");
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
        this.myFriends.push(new app_data_model_1.Friend('Felix'));
    };
    return PageModel;
}(observable_1.Observable));
;
// bind the Page template to the Data Model from above
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel;
    page.style.marginTop = -20;
    page.style.paddingTop = 20;
    status_bar_util_1.setStatusBarColorsIOS();
}
exports.pageLoaded = pageLoaded;
// add generic Page functionality
function navigateToSettings(args) {
    console.log('cog clicked');
}
exports.navigateToSettings = navigateToSettings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBR3hELHVEQUE4QztBQUU5QyxnRUFBcUU7QUFFckU7SUFBd0IsNkJBQVU7SUFLOUI7UUFBQSxZQUNJLGlCQUFPLFNBTVY7UUFMRyx5QkFBeUI7UUFDekIsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGtDQUFlLENBQVM7WUFDekMsSUFBSSx1QkFBTSxDQUFDLGNBQWMsQ0FBQztZQUMxQixJQUFJLHVCQUFNLENBQUMsZUFBZSxDQUFDO1NBQzlCLENBQUMsQ0FBQzs7SUFDUCxDQUFDO0lBRUQscURBQXFEO0lBQzlDLDZCQUFTLEdBQWhCO1FBQ0ksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSx1QkFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQWxCRCxDQUF3Qix1QkFBVSxHQWtCakM7QUFBQSxDQUFDO0FBRUYsc0RBQXNEO0FBQ3RELG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQztJQUNwQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQztJQUMzQixJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7SUFDM0IsdUNBQXFCLEVBQUUsQ0FBQztBQUM1QixDQUFDO0FBTkQsZ0NBTUM7QUFFRCxpQ0FBaUM7QUFDakMsNEJBQW1DLElBQWU7SUFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBRkQsZ0RBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEsIE9ic2VydmFibGUgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZUFycmF5IH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlLWFycmF5JztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcblxuaW1wb3J0IHsgRnJpZW5kIH0gZnJvbSAnLi4vLi4vYXBwLWRhdGEtbW9kZWwnO1xuXG5pbXBvcnQgeyBzZXRTdGF0dXNCYXJDb2xvcnNJT1MgfSBmcm9tICcuLi8uLi9zaGFyZWQvc3RhdHVzLWJhci11dGlsJztcblxuY2xhc3MgUGFnZU1vZGVsIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG5cbiAgICAvLyBkZWZpbmUgT2JzZXJ2YWJsZXMgICAgXG4gICAgcHVibGljIG15RnJpZW5kczogT2JzZXJ2YWJsZUFycmF5PEZyaWVuZD5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvLyBpbml0aWFsaXNlIE9ic2VydmFibGVzXG4gICAgICAgIHRoaXMubXlGcmllbmRzID0gbmV3IE9ic2VydmFibGVBcnJheTxGcmllbmQ+KFtcbiAgICAgICAgICAgIG5ldyBGcmllbmQoJ0ZpcnN0IEZyaWVuZCcpLFxuICAgICAgICAgICAgbmV3IEZyaWVuZCgnU2Vjb25kIEZyaWVuZCcpXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8vIGRlZmluZSBBY3Rpb25zIG9uIHRoZSBtb2RlbCAvIE9ic2VydmFibGVzIGhlcmUgICAgXG4gICAgcHVibGljIGFkZEZyaWVuZCgpIHtcbiAgICAgICAgdGhpcy5teUZyaWVuZHMucHVzaChuZXcgRnJpZW5kKCdGZWxpeCcpKTtcbiAgICB9XG59O1xuXG4vLyBiaW5kIHRoZSBQYWdlIHRlbXBsYXRlIHRvIHRoZSBEYXRhIE1vZGVsIGZyb20gYWJvdmVcbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWw7XG4gICAgcGFnZS5zdHlsZS5tYXJnaW5Ub3AgPSAtMjA7XG4gICAgcGFnZS5zdHlsZS5wYWRkaW5nVG9wID0gMjA7XG4gICAgc2V0U3RhdHVzQmFyQ29sb3JzSU9TKCk7XG59XG5cbi8vIGFkZCBnZW5lcmljIFBhZ2UgZnVuY3Rpb25hbGl0eVxuZXhwb3J0IGZ1bmN0aW9uIG5hdmlnYXRlVG9TZXR0aW5ncyhhcmdzOiBFdmVudERhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnY29nIGNsaWNrZWQnKTtcbn0iXX0=