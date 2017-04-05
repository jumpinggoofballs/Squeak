import * as LocalNotifications from "nativescript-local-notifications";
import { navigateTo } from '../app-navigation';

export function alertNow(messageSender: string) {
    LocalNotifications.schedule([{
        id: 0,
        title: 'Squeak',
        body: 'You have a new message from ' + messageSender,
        at: new Date()
    }]).then(() => {
        // console.log('success');
    }, error => {
        console.log('error');
    });
}

export function notificationListenerInit(messageSender: string) {
    LocalNotifications.addOnMessageReceivedCallback(
        function (notificationData) {
            navigateTo('chat-page', messageSender);
        }
    )
        .then(
        function () {
            console.log("Listener added");
        }
        )
}