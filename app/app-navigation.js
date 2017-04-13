"use strict";
var frameModule = require("ui/frame");
function navigateTo(pageName, params) {
    var topFrameModule = frameModule.topmost();
    topFrameModule.navigate({
        moduleName: 'views/' + pageName + '/' + pageName,
        context: {
            chatRef: params
        }
    });
}
exports.navigateTo = navigateTo;
function navigateBack() {
    // const topFrameModule = frameModule.topmost();
    // topFrameModule.goBack();
    // for the time being, this is all that is necessary and works better
    initNavigation();
}
exports.navigateBack = navigateBack;
function initNavigation() {
    var topFrameModule = frameModule.topmost();
    topFrameModule.navigate({
        moduleName: 'views/main-page/main-page',
        clearHistory: true
    });
}
exports.initNavigation = initNavigation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLW5hdmlnYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHAtbmF2aWdhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQXlDO0FBR3pDLG9CQUEyQixRQUFnQixFQUFFLE1BQWU7SUFDeEQsSUFBTSxjQUFjLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdDLGNBQWMsQ0FBQyxRQUFRLENBQUM7UUFDcEIsVUFBVSxFQUFFLFFBQVEsR0FBRyxRQUFRLEdBQUcsR0FBRyxHQUFHLFFBQVE7UUFDaEQsT0FBTyxFQUFFO1lBQ0wsT0FBTyxFQUFFLE1BQU07U0FDbEI7S0FDSixDQUFDLENBQUM7QUFDUCxDQUFDO0FBUkQsZ0NBUUM7QUFFRDtJQUNJLGdEQUFnRDtJQUNoRCwyQkFBMkI7SUFFM0IscUVBQXFFO0lBQ3JFLGNBQWMsRUFBRSxDQUFDO0FBQ3JCLENBQUM7QUFORCxvQ0FNQztBQUVEO0lBQ0ksSUFBTSxjQUFjLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdDLGNBQWMsQ0FBQyxRQUFRLENBQUM7UUFDcEIsVUFBVSxFQUFFLDJCQUEyQjtRQUN2QyxZQUFZLEVBQUUsSUFBSTtLQUNyQixDQUFDLENBQUM7QUFDUCxDQUFDO0FBTkQsd0NBTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnJhbWVNb2R1bGUgPSByZXF1aXJlKFwidWkvZnJhbWVcIik7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG5hdmlnYXRlVG8ocGFnZU5hbWU6IHN0cmluZywgcGFyYW1zPzogc3RyaW5nKSB7XG4gICAgY29uc3QgdG9wRnJhbWVNb2R1bGUgPSBmcmFtZU1vZHVsZS50b3Btb3N0KCk7XG4gICAgdG9wRnJhbWVNb2R1bGUubmF2aWdhdGUoe1xuICAgICAgICBtb2R1bGVOYW1lOiAndmlld3MvJyArIHBhZ2VOYW1lICsgJy8nICsgcGFnZU5hbWUsXG4gICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIGNoYXRSZWY6IHBhcmFtc1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYXZpZ2F0ZUJhY2soKSB7XG4gICAgLy8gY29uc3QgdG9wRnJhbWVNb2R1bGUgPSBmcmFtZU1vZHVsZS50b3Btb3N0KCk7XG4gICAgLy8gdG9wRnJhbWVNb2R1bGUuZ29CYWNrKCk7XG5cbiAgICAvLyBmb3IgdGhlIHRpbWUgYmVpbmcsIHRoaXMgaXMgYWxsIHRoYXQgaXMgbmVjZXNzYXJ5IGFuZCB3b3JrcyBiZXR0ZXJcbiAgICBpbml0TmF2aWdhdGlvbigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdE5hdmlnYXRpb24oKSB7XG4gICAgY29uc3QgdG9wRnJhbWVNb2R1bGUgPSBmcmFtZU1vZHVsZS50b3Btb3N0KCk7XG4gICAgdG9wRnJhbWVNb2R1bGUubmF2aWdhdGUoe1xuICAgICAgICBtb2R1bGVOYW1lOiAndmlld3MvbWFpbi1wYWdlL21haW4tcGFnZScsXG4gICAgICAgIGNsZWFySGlzdG9yeTogdHJ1ZVxuICAgIH0pO1xufSJdfQ==