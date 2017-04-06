import * as LocalNotifications from "nativescript-local-notifications";
import * as frameModule from 'ui/frame';
import { navigateTo } from '../app-navigation';

export function alertNow(messageSender: string, messageSenderId: string) {
    if (frameModule.topmost().currentEntry.context.chatRef === messageSenderId) {
        frameModule.topmost().currentPage.notify({
            eventName: 'newMessageReceived',
            object: this
        });
    } else {
        LocalNotifications.schedule([{
            // id: 0,
            title: 'Squeak',
            body: 'You have a new message from ' + messageSender
        }]).then(() => {
            notificationListenerInit(messageSenderId);
        }, error => {
            console.log('error');
        });
    }
}

function notificationListenerInit(messageSenderId: string) {
    LocalNotifications.addOnMessageReceivedCallback(
        function (notificationData) {
            navigateTo('chat-page', messageSenderId);
        }
    )
        .then(() => {
            console.log("Listener added");
        });
}