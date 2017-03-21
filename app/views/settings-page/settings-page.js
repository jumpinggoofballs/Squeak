"use strict";
var observable_1 = require("data/observable");
var app_navigation_1 = require("../../app-navigation");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PageModel.prototype.goBack = function () {
        app_navigation_1.navigateBack();
    };
    return PageModel;
}(observable_1.Observable));
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel;
}
exports.pageLoaded = pageLoaded;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MtcGFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNldHRpbmdzLXBhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDhDQUF3RDtBQUV4RCx1REFBb0Q7QUFFcEQ7SUFBd0IsNkJBQVU7SUFBbEM7O0lBS0EsQ0FBQztJQUhHLDBCQUFNLEdBQU47UUFDSSw2QkFBWSxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQUxELENBQXdCLHVCQUFVLEdBS2pDO0FBRUQsb0JBQTJCLElBQWU7SUFDdEMsSUFBSSxJQUFJLEdBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksU0FBUyxDQUFDO0FBQ3hDLENBQUM7QUFIRCxnQ0FHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RGF0YSwgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAndWkvcGFnZSc7XG5pbXBvcnQgeyBuYXZpZ2F0ZUJhY2sgfSBmcm9tICcuLi8uLi9hcHAtbmF2aWdhdGlvbic7XG5cbmNsYXNzIFBhZ2VNb2RlbCBleHRlbmRzIE9ic2VydmFibGUge1xuXG4gICAgZ29CYWNrKCkge1xuICAgICAgICBuYXZpZ2F0ZUJhY2soKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWw7XG59Il19