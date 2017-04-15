"use strict";
var observable_1 = require("data/observable");
var observable_array_1 = require("data/observable-array");
var appStore = require("../../data/app-store");
var app_navigation_1 = require("../../app-navigation");
var forge = require("node-forge");
var PageModel = (function (_super) {
    __extends(PageModel, _super);
    function PageModel(pageRef) {
        var _this = _super.call(this) || this;
        _this.pageRef = pageRef;
        _this.myFriends = new observable_array_1.ObservableArray([]);
        _this.populateFriendsList();
        // this.play();
        pageRef.on('refreshData', function () { return _this.populateFriendsList(); });
        return _this;
    }
    PageModel.prototype.play = function () {
        var message = 'hello';
        console.log(message + '\n');
        var keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
        var pem = forge.pki.publicKeyToPem(keypair.publicKey);
        console.log(pem + '\n');
        var publicKey = forge.pki.publicKeyFromPem(pem);
        var encrypted = publicKey.encrypt(message);
        console.log(encrypted + '\n');
        var decrypted = keypair.privateKey.decrypt(encrypted);
        console.log(decrypted + '\n');
    };
    PageModel.prototype.populateFriendsList = function () {
        var _this = this;
        appStore.getFriendsList()
            .then(function (friendsList) {
            _this.set('myFriends', friendsList);
        }, function (error) {
            alert(error);
        });
    };
    PageModel.prototype.addFriend = function () {
        app_navigation_1.navigateTo('add-friend-page');
    };
    PageModel.prototype.goToSettings = function (args) {
        app_navigation_1.navigateTo('settings-page');
    };
    return PageModel;
}(observable_1.Observable));
;
// init the Friends data from the appStore and bind the PageModel to the page;
function pageLoaded(args) {
    var page = args.object;
    page.bindingContext = new PageModel(page);
}
exports.pageLoaded = pageLoaded;
function goToChat(args) {
    app_navigation_1.navigateTo('chat-page', args.object.itemRef);
}
exports.goToChat = goToChat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4Q0FBd0Q7QUFDeEQsMERBQXdEO0FBS3hELCtDQUFpRDtBQUNqRCx1REFBa0Q7QUFFbEQsa0NBQW9DO0FBRXBDO0lBQXdCLDZCQUFVO0lBSzlCLG1CQUFZLE9BQU87UUFBbkIsWUFDSSxpQkFBTyxTQVNWO1FBUEcsS0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGtDQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFekMsS0FBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDM0IsZUFBZTtRQUVmLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBMUIsQ0FBMEIsQ0FBQyxDQUFDOztJQUNoRSxDQUFDO0lBRUQsd0JBQUksR0FBSjtRQUNJLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztRQUU1QixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRXhFLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUV4QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hELElBQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFFOUIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFFbEMsQ0FBQztJQUVPLHVDQUFtQixHQUEzQjtRQUFBLGlCQU9DO1FBTkcsUUFBUSxDQUFDLGNBQWMsRUFBRTthQUNwQixJQUFJLENBQUMsVUFBQSxXQUFXO1lBQ2IsS0FBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxFQUFFLFVBQUEsS0FBSztZQUNKLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFHTSw2QkFBUyxHQUFoQjtRQUNJLDJCQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sZ0NBQVksR0FBbkIsVUFBb0IsSUFBZTtRQUMvQiwyQkFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFNTCxnQkFBQztBQUFELENBQUMsQUF6REQsQ0FBd0IsdUJBQVUsR0F5RGpDO0FBQUEsQ0FBQztBQUdGLDhFQUE4RTtBQUM5RSxvQkFBMkIsSUFBZTtJQUN0QyxJQUFJLElBQUksR0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzdCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUhELGdDQUdDO0FBRUQsa0JBQXlCLElBQUk7SUFDekIsMkJBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBRkQsNEJBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEsIE9ic2VydmFibGUgfSBmcm9tICdkYXRhL29ic2VydmFibGUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZUFycmF5IH0gZnJvbSAnZGF0YS9vYnNlcnZhYmxlLWFycmF5JztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICd1aS9wYWdlJztcbmltcG9ydCB7IExpc3RWaWV3IH0gZnJvbSAndWkvbGlzdC12aWV3JztcblxuaW1wb3J0IHsgRnJpZW5kIH0gZnJvbSAnLi4vLi4vZGF0YS9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgKiBhcyBhcHBTdG9yZSBmcm9tICcuLi8uLi9kYXRhL2FwcC1zdG9yZSc7XG5pbXBvcnQgeyBuYXZpZ2F0ZVRvIH0gZnJvbSAnLi4vLi4vYXBwLW5hdmlnYXRpb24nO1xuXG5pbXBvcnQgKiBhcyBmb3JnZSBmcm9tICdub2RlLWZvcmdlJztcblxuY2xhc3MgUGFnZU1vZGVsIGV4dGVuZHMgT2JzZXJ2YWJsZSB7XG5cbiAgICBwcml2YXRlIHBhZ2VSZWY7XG4gICAgcHVibGljIG15RnJpZW5kczogT2JzZXJ2YWJsZUFycmF5PE9iamVjdD47XG5cbiAgICBjb25zdHJ1Y3RvcihwYWdlUmVmKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5wYWdlUmVmID0gcGFnZVJlZjtcbiAgICAgICAgdGhpcy5teUZyaWVuZHMgPSBuZXcgT2JzZXJ2YWJsZUFycmF5KFtdKTtcblxuICAgICAgICB0aGlzLnBvcHVsYXRlRnJpZW5kc0xpc3QoKTtcbiAgICAgICAgLy8gdGhpcy5wbGF5KCk7XG5cbiAgICAgICAgcGFnZVJlZi5vbigncmVmcmVzaERhdGEnLCAoKSA9PiB0aGlzLnBvcHVsYXRlRnJpZW5kc0xpc3QoKSk7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSAnaGVsbG8nO1xuICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlICsgJ1xcbicpO1xuXG4gICAgICAgIHZhciBrZXlwYWlyID0gZm9yZ2UucGtpLnJzYS5nZW5lcmF0ZUtleVBhaXIoeyBiaXRzOiAyMDQ4LCBlOiAweDEwMDAxIH0pO1xuXG4gICAgICAgIHZhciBwZW0gPSBmb3JnZS5wa2kucHVibGljS2V5VG9QZW0oa2V5cGFpci5wdWJsaWNLZXkpO1xuICAgICAgICBjb25zb2xlLmxvZyhwZW0gKyAnXFxuJyk7XG5cbiAgICAgICAgdmFyIHB1YmxpY0tleSA9IGZvcmdlLnBraS5wdWJsaWNLZXlGcm9tUGVtKHBlbSk7XG4gICAgICAgIHZhciBlbmNyeXB0ZWQgPSBwdWJsaWNLZXkuZW5jcnlwdChtZXNzYWdlKTtcbiAgICAgICAgY29uc29sZS5sb2coZW5jcnlwdGVkICsgJ1xcbicpO1xuXG4gICAgICAgIHZhciBkZWNyeXB0ZWQgPSBrZXlwYWlyLnByaXZhdGVLZXkuZGVjcnlwdChlbmNyeXB0ZWQpO1xuICAgICAgICBjb25zb2xlLmxvZyhkZWNyeXB0ZWQgKyAnXFxuJyk7XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIHBvcHVsYXRlRnJpZW5kc0xpc3QoKSB7XG4gICAgICAgIGFwcFN0b3JlLmdldEZyaWVuZHNMaXN0KClcbiAgICAgICAgICAgIC50aGVuKGZyaWVuZHNMaXN0ID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldCgnbXlGcmllbmRzJywgZnJpZW5kc0xpc3QpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgcHVibGljIGFkZEZyaWVuZCgpIHtcbiAgICAgICAgbmF2aWdhdGVUbygnYWRkLWZyaWVuZC1wYWdlJyk7XG4gICAgfVxuXG4gICAgcHVibGljIGdvVG9TZXR0aW5ncyhhcmdzOiBFdmVudERhdGEpIHtcbiAgICAgICAgbmF2aWdhdGVUbygnc2V0dGluZ3MtcGFnZScpO1xuICAgIH1cblxuICAgIC8vIExpc3RWaWV3Oml0ZW1UYXAgYW5kIEdyaWRWaWV3IGFyZSBub3QgcGxheWluZyBuaWNlbHkgd2l0aCBlYWNoIG90aGVyIHNvIHRoaXMgaGFzIGJlZW4gdGFrZW4gb3V0IG9mIGhlcmUgYW5kIGltcGxlbWVudGVkIGFzIGEgR3JpZFZpZXc6dGFwIGJlbG93IFxuICAgIC8vIHB1YmxpYyBnb1RvQ2hhdChhcmdzKSB7XG4gICAgLy8gICAgIG5hdmlnYXRlVG8oJ2NoYXQtcGFnZScsIHRoaXMubXlGcmllbmRzW2FyZ3MuaW5kZXhdLl9pZCk7XG4gICAgLy8gfVxufTtcblxuXG4vLyBpbml0IHRoZSBGcmllbmRzIGRhdGEgZnJvbSB0aGUgYXBwU3RvcmUgYW5kIGJpbmQgdGhlIFBhZ2VNb2RlbCB0byB0aGUgcGFnZTtcbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IEV2ZW50RGF0YSkge1xuICAgIHZhciBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBQYWdlTW9kZWwocGFnZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnb1RvQ2hhdChhcmdzKSB7XG4gICAgbmF2aWdhdGVUbygnY2hhdC1wYWdlJywgYXJncy5vYmplY3QuaXRlbVJlZik7XG59Il19