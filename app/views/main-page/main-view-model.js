"use strict";
var observable_1 = require("data/observable");
var MainPageModel = (function (_super) {
    __extends(MainPageModel, _super);
    // private counter: number;
    function MainPageModel() {
        var _this = _super.call(this) || this;
        _this.set('message', 'this be the data model');
        _this.set('myFriends', [
            {
                nickname: 'Shachi'
            },
            {
                nickname: 'Loughlin'
            },
        ]);
        return _this;
    }
    return MainPageModel;
}(observable_1.Observable));
exports.MainPageModel = MainPageModel;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi12aWV3LW1vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi12aWV3LW1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBNkM7QUFFN0M7SUFBbUMsaUNBQVU7SUFFekMsMkJBQTJCO0lBRTNCO1FBQUEsWUFDSSxpQkFBTyxTQVdWO1FBVEcsS0FBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUM5QyxLQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRTtZQUNsQjtnQkFDSSxRQUFRLEVBQUUsUUFBUTthQUNyQjtZQUNEO2dCQUNJLFFBQVEsRUFBRSxVQUFVO2FBQ3ZCO1NBQ0osQ0FBQyxDQUFDOztJQUNQLENBQUM7SUFXTCxvQkFBQztBQUFELENBQUMsQUEzQkQsQ0FBbUMsdUJBQVUsR0EyQjVDO0FBM0JZLHNDQUFhO0FBMkJ6QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5cbmV4cG9ydCBjbGFzcyBNYWluUGFnZU1vZGVsIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG5cbiAgICAvLyBwcml2YXRlIGNvdW50ZXI6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc2V0KCdtZXNzYWdlJywgJ3RoaXMgYmUgdGhlIGRhdGEgbW9kZWwnKTtcbiAgICAgICAgdGhpcy5zZXQoJ215RnJpZW5kcycsIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuaWNrbmFtZTogJ1NoYWNoaSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmlja25hbWU6ICdMb3VnaGxpbidcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8vIHB1YmxpYyB0YXBBY3Rpb24oKSB7XG4gICAgLy8gICAgIHRoaXMuY291bnRlci0tO1xuICAgIC8vICAgICBpZiAodGhpcy5jb3VudGVyIDw9IDApIHtcbiAgICAvLyAgICAgICAgIHRoaXMuc2V0KCdtZXNzYWdlJywgJ0hvb3JyYWFheSEgWW91IHVubG9ja2VkIHRoZSBOYXRpdmVTY3JpcHQgY2xpY2tlciBhY2hpZXZlbWVudCEnKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICBlbHNlIHtcbiAgICAvLyAgICAgICAgIHRoaXMuc2V0KCdtZXNzYWdlJywgdGhpcy5jb3VudGVyICsgJyB0YXBzIGxlZnQnKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cbn07XG4iXX0=