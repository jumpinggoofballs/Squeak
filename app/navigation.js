"use strict";
var frameModule = require("ui/frame");
function navigateTo(pageName, params) {
    var topFrameModule = frameModule.topmost();
    topFrameModule.navigate({
        moduleName: 'views/' + pageName + '/' + pageName,
        context: {
            chatName: params
        }
    });
}
exports.navigateTo = navigateTo;
function navigateBack() {
    var topFrameModule = frameModule.topmost();
    topFrameModule.goBack();
}
exports.navigateBack = navigateBack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5hdmlnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHNDQUF5QztBQUd6QyxvQkFBMkIsUUFBZ0IsRUFBRSxNQUFlO0lBQ3hELElBQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QyxjQUFjLENBQUMsUUFBUSxDQUFDO1FBQ3BCLFVBQVUsRUFBRSxRQUFRLEdBQUcsUUFBUSxHQUFHLEdBQUcsR0FBRyxRQUFRO1FBQ2hELE9BQU8sRUFBRTtZQUNMLFFBQVEsRUFBRSxNQUFNO1NBQ25CO0tBQ0osQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQVJELGdDQVFDO0FBRUQ7SUFDSSxJQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0MsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzVCLENBQUM7QUFIRCxvQ0FHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcmFtZU1vZHVsZSA9IHJlcXVpcmUoXCJ1aS9mcmFtZVwiKTtcblxuXG5leHBvcnQgZnVuY3Rpb24gbmF2aWdhdGVUbyhwYWdlTmFtZTogc3RyaW5nLCBwYXJhbXM/OiBzdHJpbmcpIHtcbiAgICBjb25zdCB0b3BGcmFtZU1vZHVsZSA9IGZyYW1lTW9kdWxlLnRvcG1vc3QoKTtcbiAgICB0b3BGcmFtZU1vZHVsZS5uYXZpZ2F0ZSh7XG4gICAgICAgIG1vZHVsZU5hbWU6ICd2aWV3cy8nICsgcGFnZU5hbWUgKyAnLycgKyBwYWdlTmFtZSxcbiAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgICAgY2hhdE5hbWU6IHBhcmFtc1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYXZpZ2F0ZUJhY2soKSB7XG4gICAgY29uc3QgdG9wRnJhbWVNb2R1bGUgPSBmcmFtZU1vZHVsZS50b3Btb3N0KCk7XG4gICAgdG9wRnJhbWVNb2R1bGUuZ29CYWNrKCk7XG59Il19