"use strict";
var observable_1 = require("data/observable");
var app_navigation_1 = require("../../app-navigation");
var app_store_1 = require("../../data/app-store");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
        _this.nickname = 'Squaaaaa';
        _this.avatarPath = '~/images/avatar.png';
        _this.nicknameEditMode = false;
        _this.setLocalAccountDetails();
        return _this;
    }
    PageModel.prototype.setLocalAccountDetails = function () {
        var localAccountDocument = app_store_1.fetchLocalAccountDetails();
        this.set('nickname', localAccountDocument.settings.nickname);
        this.set('avatarPath', localAccountDocument.settings.avatarPath);
    };
    PageModel.prototype.toggleNicknameEdit = function () {
        this.set('nicknameEditMode', !this.nicknameEditMode);
        this.pageRef.getViewById('nicknameInput').focus();
    };
    PageModel.prototype.saveNickname = function () {
        app_store_1.updateLocalNickname(this.nickname);
        this.toggleNicknameEdit();
        this.pageRef.getViewById('nicknameInput').dismissSoftInput();
    };
    PageModel.prototype.goBack = function () {
        app_navigation_1.navigateBack();
    };
    return PageModel;
}(observable_1.Observable));
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel(page);
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MtcGFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNldHRpbmdzLXBhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDhDQUF3RDtBQUl4RCx1REFBb0Q7QUFDcEQsa0RBQXFGO0FBRXJGO0lBQXdCLDZCQUFVO0lBTzlCLG1CQUFZLE9BQVk7UUFBeEIsWUFDSSxpQkFBTyxTQVFWO1FBTkcsS0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsS0FBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7UUFDM0IsS0FBSSxDQUFDLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQztRQUN4QyxLQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1FBRTlCLEtBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDOztJQUNsQyxDQUFDO0lBRUQsMENBQXNCLEdBQXRCO1FBQ0ksSUFBSSxvQkFBb0IsR0FBRyxvQ0FBd0IsRUFBRSxDQUFDO1FBQ3RELElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELHNDQUFrQixHQUFsQjtRQUNJLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNyRCxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN0RCxDQUFDO0lBRUQsZ0NBQVksR0FBWjtRQUNJLCtCQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ2pFLENBQUM7SUFFRCwwQkFBTSxHQUFOO1FBQ0ksNkJBQVksRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUF0Q0QsQ0FBd0IsdUJBQVUsR0FzQ2pDO0FBRUQsb0JBQTJCLElBQWU7SUFDdEMsSUFBSSxJQUFJLEdBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFIRCxnQ0FHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAndWkvcGFnZSc7XG5pbXBvcnQgKiBhcyBTb2NpYWxTaGFyZSBmcm9tIFwibmF0aXZlc2NyaXB0LXNvY2lhbC1zaGFyZVwiO1xuXG5pbXBvcnQgeyBuYXZpZ2F0ZUJhY2sgfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG5pbXBvcnQgeyBmZXRjaExvY2FsQWNjb3VudERldGFpbHMsIHVwZGF0ZUxvY2FsTmlja25hbWUgfSBmcm9tICcuLi8uLi9kYXRhL2FwcC1zdG9yZSc7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgcHJpdmF0ZSBwYWdlUmVmO1xuICAgIHByaXZhdGUgbmlja25hbWU7XG4gICAgcHJpdmF0ZSBhdmF0YXJQYXRoO1xuICAgIHByaXZhdGUgbmlja25hbWVFZGl0TW9kZTtcblxuICAgIGNvbnN0cnVjdG9yKHBhZ2VSZWY6IGFueSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMucGFnZVJlZiA9IHBhZ2VSZWY7XG4gICAgICAgIHRoaXMubmlja25hbWUgPSAnU3F1YWFhYWEnO1xuICAgICAgICB0aGlzLmF2YXRhclBhdGggPSAnfi9pbWFnZXMvYXZhdGFyLnBuZyc7XG4gICAgICAgIHRoaXMubmlja25hbWVFZGl0TW9kZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuc2V0TG9jYWxBY2NvdW50RGV0YWlscygpO1xuICAgIH1cblxuICAgIHNldExvY2FsQWNjb3VudERldGFpbHMoKSB7XG4gICAgICAgIHZhciBsb2NhbEFjY291bnREb2N1bWVudCA9IGZldGNoTG9jYWxBY2NvdW50RGV0YWlscygpO1xuICAgICAgICB0aGlzLnNldCgnbmlja25hbWUnLCBsb2NhbEFjY291bnREb2N1bWVudC5zZXR0aW5ncy5uaWNrbmFtZSk7XG4gICAgICAgIHRoaXMuc2V0KCdhdmF0YXJQYXRoJywgbG9jYWxBY2NvdW50RG9jdW1lbnQuc2V0dGluZ3MuYXZhdGFyUGF0aCk7XG4gICAgfVxuXG4gICAgdG9nZ2xlTmlja25hbWVFZGl0KCkge1xuICAgICAgICB0aGlzLnNldCgnbmlja25hbWVFZGl0TW9kZScsICF0aGlzLm5pY2tuYW1lRWRpdE1vZGUpO1xuICAgICAgICB0aGlzLnBhZ2VSZWYuZ2V0Vmlld0J5SWQoJ25pY2tuYW1lSW5wdXQnKS5mb2N1cygpO1xuICAgIH1cblxuICAgIHNhdmVOaWNrbmFtZSgpIHtcbiAgICAgICAgdXBkYXRlTG9jYWxOaWNrbmFtZSh0aGlzLm5pY2tuYW1lKTtcbiAgICAgICAgdGhpcy50b2dnbGVOaWNrbmFtZUVkaXQoKTtcbiAgICAgICAgdGhpcy5wYWdlUmVmLmdldFZpZXdCeUlkKCduaWNrbmFtZUlucHV0JykuZGlzbWlzc1NvZnRJbnB1dCgpO1xuICAgIH1cblxuICAgIGdvQmFjaygpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKHBhZ2UpO1xufSJdfQ==