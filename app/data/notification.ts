import * as LocalNotifications from "nativescript-local-notifications";

export function alertNow(message: string) {
    LocalNotifications.schedule([{
        id: 0,
        title: 'title',
        body: message,
        ticker: 'ticker',
        at: new Date()
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
            alert({
                'title': "Notification Received",
                'message': notificationData.title
            });
        }
    )
        .then(
        function () {
            console.log("Listener added");
        }
        )
}