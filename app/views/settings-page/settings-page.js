"use strict";
var observable_1 = require("data/observable");
var SocialShare = require("nativescript-social-share");
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
        _this.myCode = '';
        _this.setLocalAccountDetails();
        return _this;
    }
    PageModel.prototype.setLocalAccountDetails = function () {
        var localAccountDocument = app_store_1.fetchLocalAccountDetails();
        this.set('nickname', localAccountDocument.settings.nickname);
        this.set('avatarPath', localAccountDocument.settings.avatarPath);
        this.set('myCode', localAccountDocument.settings.firebaseUID);
    };
    PageModel.prototype.toggleNicknameEdit = function () {
        this.set('nicknameEditMode', !this.nicknameEditMode);
        this.pageRef.getViewById('goofball').focus();
    };
    PageModel.prototype.saveNickname = function () {
        app_store_1.updateLocalNickname(this.nickname);
        this.toggleNicknameEdit();
        this.pageRef.getViewById('goofball').dismissSoftInput();
    };
    PageModel.prototype.shareCode = function () {
        SocialShare.shareText('Hey, my Squeak code is: ' + this.myCode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MtcGFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNldHRpbmdzLXBhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDhDQUF3RDtBQUV4RCx1REFBeUQ7QUFFekQsdURBQW9EO0FBQ3BELGtEQUFxRjtBQUVyRjtJQUF3Qiw2QkFBVTtJQVE5QixtQkFBWSxPQUFZO1FBQXhCLFlBQ0ksaUJBQU8sU0FTVjtRQVBHLEtBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLEtBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1FBQzNCLEtBQUksQ0FBQyxVQUFVLEdBQUcscUJBQXFCLENBQUM7UUFDeEMsS0FBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztRQUM5QixLQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUVqQixLQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQzs7SUFDbEMsQ0FBQztJQUVELDBDQUFzQixHQUF0QjtRQUNJLElBQUksb0JBQW9CLEdBQUcsb0NBQXdCLEVBQUUsQ0FBQztRQUN0RCxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2pFLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQsc0NBQWtCLEdBQWxCO1FBQ0ksSUFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pELENBQUM7SUFFRCxnQ0FBWSxHQUFaO1FBQ0ksK0JBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDNUQsQ0FBQztJQUVELDZCQUFTLEdBQVQ7UUFDSSxXQUFXLENBQUMsU0FBUyxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRUQsMEJBQU0sR0FBTjtRQUNJLDZCQUFZLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBN0NELENBQXdCLHVCQUFVLEdBNkNqQztBQUVELG9CQUEyQixJQUFlO0lBQ3RDLElBQUksSUFBSSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBSEQsZ0NBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEsIE9ic2VydmFibGUgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ3VpL3BhZ2UnO1xuaW1wb3J0ICogYXMgU29jaWFsU2hhcmUgZnJvbSBcIm5hdGl2ZXNjcmlwdC1zb2NpYWwtc2hhcmVcIjtcblxuaW1wb3J0IHsgbmF2aWdhdGVCYWNrIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuaW1wb3J0IHsgZmV0Y2hMb2NhbEFjY291bnREZXRhaWxzLCB1cGRhdGVMb2NhbE5pY2tuYW1lIH0gZnJvbSAnLi4vLi4vZGF0YS9hcHAtc3RvcmUnO1xuXG5jbGFzcyBQYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIHByaXZhdGUgcGFnZVJlZjtcbiAgICBwcml2YXRlIG5pY2tuYW1lO1xuICAgIHByaXZhdGUgYXZhdGFyUGF0aDtcbiAgICBwcml2YXRlIG5pY2tuYW1lRWRpdE1vZGU7XG4gICAgcHJpdmF0ZSBteUNvZGU7XG5cbiAgICBjb25zdHJ1Y3RvcihwYWdlUmVmOiBhbnkpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnBhZ2VSZWYgPSBwYWdlUmVmO1xuICAgICAgICB0aGlzLm5pY2tuYW1lID0gJ1NxdWFhYWFhJztcbiAgICAgICAgdGhpcy5hdmF0YXJQYXRoID0gJ34vaW1hZ2VzL2F2YXRhci5wbmcnO1xuICAgICAgICB0aGlzLm5pY2tuYW1lRWRpdE1vZGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5teUNvZGUgPSAnJztcblxuICAgICAgICB0aGlzLnNldExvY2FsQWNjb3VudERldGFpbHMoKTtcbiAgICB9XG5cbiAgICBzZXRMb2NhbEFjY291bnREZXRhaWxzKCkge1xuICAgICAgICB2YXIgbG9jYWxBY2NvdW50RG9jdW1lbnQgPSBmZXRjaExvY2FsQWNjb3VudERldGFpbHMoKTtcbiAgICAgICAgdGhpcy5zZXQoJ25pY2tuYW1lJywgbG9jYWxBY2NvdW50RG9jdW1lbnQuc2V0dGluZ3Mubmlja25hbWUpO1xuICAgICAgICB0aGlzLnNldCgnYXZhdGFyUGF0aCcsIGxvY2FsQWNjb3VudERvY3VtZW50LnNldHRpbmdzLmF2YXRhclBhdGgpO1xuICAgICAgICB0aGlzLnNldCgnbXlDb2RlJywgbG9jYWxBY2NvdW50RG9jdW1lbnQuc2V0dGluZ3MuZmlyZWJhc2VVSUQpO1xuICAgIH1cblxuICAgIHRvZ2dsZU5pY2tuYW1lRWRpdCgpIHtcbiAgICAgICAgdGhpcy5zZXQoJ25pY2tuYW1lRWRpdE1vZGUnLCAhdGhpcy5uaWNrbmFtZUVkaXRNb2RlKTtcbiAgICAgICAgdGhpcy5wYWdlUmVmLmdldFZpZXdCeUlkKCdnb29mYmFsbCcpLmZvY3VzKCk7XG4gICAgfVxuXG4gICAgc2F2ZU5pY2tuYW1lKCkge1xuICAgICAgICB1cGRhdGVMb2NhbE5pY2tuYW1lKHRoaXMubmlja25hbWUpO1xuICAgICAgICB0aGlzLnRvZ2dsZU5pY2tuYW1lRWRpdCgpO1xuICAgICAgICB0aGlzLnBhZ2VSZWYuZ2V0Vmlld0J5SWQoJ2dvb2ZiYWxsJykuZGlzbWlzc1NvZnRJbnB1dCgpO1xuICAgIH1cblxuICAgIHNoYXJlQ29kZSgpIHtcbiAgICAgICAgU29jaWFsU2hhcmUuc2hhcmVUZXh0KCdIZXksIG15IFNxdWVhayBjb2RlIGlzOiAnICsgdGhpcy5teUNvZGUpO1xuICAgIH1cblxuICAgIGdvQmFjaygpIHtcbiAgICAgICAgbmF2aWdhdGVCYWNrKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFnZUxvYWRlZChhcmdzOiBFdmVudERhdGEpIHtcbiAgICB2YXIgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKHBhZ2UpO1xufSJdfQ==