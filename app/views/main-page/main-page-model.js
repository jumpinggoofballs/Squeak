"use strict";
var observable_1 = require("data/observable");
var MainPageModel = (function (_super) {
    __extends(MainPageModel, _super);
    // Add private variables here    
    // private counter: number;
    function MainPageModel() {
        var _this = _super.call(this) || this;
        // set observables here        
        _this.set('message', 'this be the data model');
        _this.set('myFriends', [
            {
                nickname: 'First Friend'
            },
            {
                nickname: 'Second Friend'
            },
        ]);
        return _this;
    }
    return MainPageModel;
}(observable_1.Observable));
exports.MainPageModel = MainPageModel;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLW1vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLW1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBNkM7QUFFN0M7SUFBbUMsaUNBQVU7SUFFekMsaUNBQWlDO0lBQ2pDLDJCQUEyQjtJQUUzQjtRQUFBLFlBQ0ksaUJBQU8sU0FZVjtRQVZHLCtCQUErQjtRQUMvQixLQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBQzlDLEtBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFO1lBQ2xCO2dCQUNJLFFBQVEsRUFBRSxjQUFjO2FBQzNCO1lBQ0Q7Z0JBQ0ksUUFBUSxFQUFFLGVBQWU7YUFDNUI7U0FDSixDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQVlMLG9CQUFDO0FBQUQsQ0FBQyxBQTlCRCxDQUFtQyx1QkFBVSxHQThCNUM7QUE5Qlksc0NBQWE7QUE4QnpCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlJztcblxuZXhwb3J0IGNsYXNzIE1haW5QYWdlTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcblxuICAgIC8vIEFkZCBwcml2YXRlIHZhcmlhYmxlcyBoZXJlICAgIFxuICAgIC8vIHByaXZhdGUgY291bnRlcjogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgLy8gc2V0IG9ic2VydmFibGVzIGhlcmUgICAgICAgIFxuICAgICAgICB0aGlzLnNldCgnbWVzc2FnZScsICd0aGlzIGJlIHRoZSBkYXRhIG1vZGVsJyk7XG4gICAgICAgIHRoaXMuc2V0KCdteUZyaWVuZHMnLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmlja25hbWU6ICdGaXJzdCBGcmllbmQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5pY2tuYW1lOiAnU2Vjb25kIEZyaWVuZCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIC8vIGRlZmluZSBBY3Rpb25zIGhlcmUgICAgXG4gICAgLy8gcHVibGljIHRhcEFjdGlvbigpIHtcbiAgICAvLyAgICAgdGhpcy5jb3VudGVyLS07XG4gICAgLy8gICAgIGlmICh0aGlzLmNvdW50ZXIgPD0gMCkge1xuICAgIC8vICAgICAgICAgdGhpcy5zZXQoJ21lc3NhZ2UnLCAnSG9vcnJhYWF5ISBZb3UgdW5sb2NrZWQgdGhlIE5hdGl2ZVNjcmlwdCBjbGlja2VyIGFjaGlldmVtZW50IScpO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIGVsc2Uge1xuICAgIC8vICAgICAgICAgdGhpcy5zZXQoJ21lc3NhZ2UnLCB0aGlzLmNvdW50ZXIgKyAnIHRhcHMgbGVmdCcpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxufTtcbiJdfQ==