import * as LocalNotifications from "nativescript-local-notifications";
import * as frameModule from 'ui/frame';
import { navigateTo } from '../app-navigation';

export function alertNow(messageSender: string, messageSenderId: string) {

    var randomNotificationId = getRandomInt(1, 5000);

    // if the notifications is from the user currently represented in the chat view, just update the chat view via the newMessageReceived event on that page
    if (frameModule.topmost().currentEntry.context.chatRef === messageSenderId) {
        frameModule.topmost().currentPage.notify({
            eventName: 'newMessageReceived',
            object: this
        });
    } else {
        // else schedule notification
        LocalNotifications.schedule([{
            id: randomNotificationId,
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

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}