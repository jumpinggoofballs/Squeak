import * as LocalNotifications from "nativescript-local-notifications";
import * as dialogs from 'ui/dialogs';

export function scheduleAlert() {
    LocalNotifications.schedule([{
        id: 0,
        title: 'title',
        body: 'body',
        ticker: 'ticker',
        at: new Date(new Date().getTime() + 10 * 1000)
    }]).then(() => {
        console.log('success');
    }, error => {
        console.log('error');
    });
}

export function notificationListenerInit() {
    LocalNotifications.addOnMessageReceivedCallback(
        function (notificationData) {
            // this will be changed to navigateTo function
            dialogs.alert({
                'title': "Notification Received",
                'message': notificationData.title
            });
        }
    ).then(
        function () {
            console.log("Listener added");
        }
        )
}

export var LocalNotificationsRef = LocalNotifications;