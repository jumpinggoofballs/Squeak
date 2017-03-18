"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var app_data_model_1 = require("../../data/app-data-model");
var app_navigation_1 = require("../../app-navigation");
// import { setStatusBarColorsIOS } from '../../shared/status-bar-util';
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(database) {
        var _this = _super.call(this) || this;
        _this.dbRef = database;
        _this.myFriends = new observable_array_1.ObservableArray();
        _this.dbRef.all('SELECT * FROM friends').then(function (rows) {
            for (var row in rows) {
                _this.myFriends.push(new app_data_model_1.Friend(rows[row][1]));
            }
        }, function (error) {
            console.log('select error');
        });
        return _this;
    }
    // define Actions on the model / Observables here    
    PageModel.prototype.addFriend = function () {
        var _this = this;
        this.dbRef.execSQL('INSERT INTO friends (nickname) VALUES (?)', ['testy test friend 3']).then(function () {
            _this.myFriends.push(new app_data_model_1.Friend('testy test friend 3'));
        }, function (error) {
            console.log('insert error');
        });
        console.log(this.dbRef);
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
    var Sqlite = require('nativescript-sqlite');
    (new Sqlite('test.db')).then(function (db) {
        db.execSQL('CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT)').then(function (id) {
            page.bindingContext = new PageModel(db);
        }, function (error) {
            console.log('create table error ' + error);
        });
    }, function (error) {
        console.log('create db error');
    });
    // page.bindingContext = new PageModel();
    // This makes the phone Status Bar the same color as the app Action Bar (??)
    // page.style.marginTop = -20;
    // page.style.paddingTop = 20;
    // setStatusBarColorsIOS();
}
exports.pageLoaded = pageLoaded;
// add generic Page functionality below
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBSXhELDREQUFtRDtBQUNuRCx1REFBa0Q7QUFFbEQsd0VBQXdFO0FBRXhFO0lBQXdCLDZCQUFVO0lBSzlCLG1CQUFZLFFBQWE7UUFBekIsWUFDSSxpQkFBTyxTQWFWO1FBWEcsS0FBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7UUFFdEIsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGtDQUFlLEVBQVUsQ0FBQztRQUUvQyxLQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUk7WUFDN0MsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDbkIsS0FBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSx1QkFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNMLENBQUMsRUFBRSxVQUFBLEtBQUs7WUFDSixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDOztJQUNQLENBQUM7SUFFRCxxREFBcUQ7SUFDOUMsNkJBQVMsR0FBaEI7UUFBQSxpQkFPQztRQU5HLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLDJDQUEyQyxFQUFFLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxRixLQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLHVCQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUMsRUFBRSxVQUFBLEtBQUs7WUFDSixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELGdDQUFZLEdBQVosVUFBYSxJQUFlO1FBQ3hCLDJCQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELDRCQUFRLEdBQVIsVUFBUyxJQUFJO1FBQ1QsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQztRQUM1RCwyQkFBVSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBdkNELENBQXdCLHVCQUFVLEdBdUNqQztBQUFBLENBQUM7QUFFRixzREFBc0Q7QUFDdEQsb0JBQTJCLElBQWU7SUFDdEMsSUFBSSxJQUFJLEdBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUM3QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUM1QyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsRUFBRTtRQUMzQixFQUFFLENBQUMsT0FBTyxDQUFDLDBGQUEwRixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsRUFBRTtZQUMxRyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLENBQUMsRUFBRSxVQUFBLEtBQUs7WUFDSixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxDQUFDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxFQUFFLFVBQUEsS0FBSztRQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUMsQ0FBQztJQUNILHlDQUF5QztJQUV6Qyw0RUFBNEU7SUFDNUUsOEJBQThCO0lBQzlCLDhCQUE4QjtJQUM5QiwyQkFBMkI7QUFDL0IsQ0FBQztBQWxCRCxnQ0FrQkM7QUFFRCx1Q0FBdUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEsIE9ic2VydmFibGUgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZUFycmF5IH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlLWFycmF5JztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IExpc3RWaWV3IH0gZnJvbSAndWkvbGlzdC12aWV3JztcblxuaW1wb3J0IHsgRnJpZW5kIH0gZnJvbSAnLi4vLi4vZGF0YS9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgeyBuYXZpZ2F0ZVRvIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuXG4vLyBpbXBvcnQgeyBzZXRTdGF0dXNCYXJDb2xvcnNJT1MgfSBmcm9tICcuLi8uLi9zaGFyZWQvc3RhdHVzLWJhci11dGlsJztcblxuY2xhc3MgUGFnZU1vZGVsIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG5cbiAgICBwdWJsaWMgbXlGcmllbmRzOiBPYnNlcnZhYmxlQXJyYXk8RnJpZW5kPjtcbiAgICBwdWJsaWMgZGJSZWY6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKGRhdGFiYXNlOiBhbnkpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmRiUmVmID0gZGF0YWJhc2U7XG5cbiAgICAgICAgdGhpcy5teUZyaWVuZHMgPSBuZXcgT2JzZXJ2YWJsZUFycmF5PEZyaWVuZD4oKTtcblxuICAgICAgICB0aGlzLmRiUmVmLmFsbCgnU0VMRUNUICogRlJPTSBmcmllbmRzJykudGhlbihyb3dzID0+IHtcbiAgICAgICAgICAgIGZvciAodmFyIHJvdyBpbiByb3dzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5teUZyaWVuZHMucHVzaChuZXcgRnJpZW5kKHJvd3Nbcm93XVsxXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnc2VsZWN0IGVycm9yJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGRlZmluZSBBY3Rpb25zIG9uIHRoZSBtb2RlbCAvIE9ic2VydmFibGVzIGhlcmUgICAgXG4gICAgcHVibGljIGFkZEZyaWVuZCgpIHtcbiAgICAgICAgdGhpcy5kYlJlZi5leGVjU1FMKCdJTlNFUlQgSU5UTyBmcmllbmRzIChuaWNrbmFtZSkgVkFMVUVTICg/KScsIFsndGVzdHkgdGVzdCBmcmllbmQgMyddKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubXlGcmllbmRzLnB1c2gobmV3IEZyaWVuZCgndGVzdHkgdGVzdCBmcmllbmQgMycpKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2luc2VydCBlcnJvcicpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5kYlJlZik7XG4gICAgfVxuXG4gICAgZ29Ub1NldHRpbmdzKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgICAgICBuYXZpZ2F0ZVRvKCdzZXR0aW5ncy1wYWdlJyk7XG4gICAgfVxuXG4gICAgZ29Ub0NoYXQoYXJncykge1xuICAgICAgICB2YXIgY2hhdFRpdGxlID0gdGhpcy5teUZyaWVuZHMuZ2V0SXRlbShhcmdzLmluZGV4KS5uaWNrbmFtZTtcbiAgICAgICAgbmF2aWdhdGVUbygnY2hhdC1wYWdlJywgY2hhdFRpdGxlKTtcbiAgICB9XG59O1xuXG4vLyBiaW5kIHRoZSBQYWdlIHRlbXBsYXRlIHRvIHRoZSBEYXRhIE1vZGVsIGZyb20gYWJvdmVcbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgdmFyIFNxbGl0ZSA9IHJlcXVpcmUoJ25hdGl2ZXNjcmlwdC1zcWxpdGUnKTtcbiAgICAobmV3IFNxbGl0ZSgndGVzdC5kYicpKS50aGVuKGRiID0+IHtcbiAgICAgICAgZGIuZXhlY1NRTCgnQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgZnJpZW5kcyAoaWQgSU5URUdFUiBQUklNQVJZIEtFWSBBVVRPSU5DUkVNRU5ULCBuaWNrbmFtZSBURVhUKScpLnRoZW4oaWQgPT4ge1xuICAgICAgICAgICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWwoZGIpO1xuICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY3JlYXRlIHRhYmxlIGVycm9yICcgKyBlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZSBkYiBlcnJvcicpO1xuICAgIH0pO1xuICAgIC8vIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBuZXcgUGFnZU1vZGVsKCk7XG5cbiAgICAvLyBUaGlzIG1ha2VzIHRoZSBwaG9uZSBTdGF0dXMgQmFyIHRoZSBzYW1lIGNvbG9yIGFzIHRoZSBhcHAgQWN0aW9uIEJhciAoPz8pXG4gICAgLy8gcGFnZS5zdHlsZS5tYXJnaW5Ub3AgPSAtMjA7XG4gICAgLy8gcGFnZS5zdHlsZS5wYWRkaW5nVG9wID0gMjA7XG4gICAgLy8gc2V0U3RhdHVzQmFyQ29sb3JzSU9TKCk7XG59XG5cbi8vIGFkZCBnZW5lcmljIFBhZ2UgZnVuY3Rpb25hbGl0eSBiZWxvd1xuIl19