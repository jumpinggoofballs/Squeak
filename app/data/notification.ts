import * as LocalNotifications from "nativescript-local-notifications";
import * as frameModule from 'ui/frame';
import * as dialogs from 'ui/dialogs';

import { navigateTo } from '../app-navigation';

export function alertNewMessage(messageSender: string, messageSenderId: string) {

    var randomNotificationId = getRandomInt(1, 5000);

    // if the notifications is from the user currently represented in the chat view, just update the chat view via the newMessageReceived event on that page
    if (frameModule.topmost().currentEntry.context.chatRef === messageSenderId) {
        frameModule.topmost().currentPage.notify({
            eventName: 'newMessageReceived',
            object: this
        });
    }

    // if the user is on the main page, update the main page with new message badges and the like    
    if (frameModule.topmost().currentEntry.moduleName === 'views/main-page/main-page') {
        frameModule.topmost().currentPage.notify({
            eventName: 'refreshData',
            object: this
        });
    }

    LocalNotifications.schedule([{
        id: randomNotificationId,
        title: 'Squeak',
        body: 'You have a new message from ' + messageSender
    }]).then(() => {
        LocalNotifications.addOnMessageReceivedCallback(() => navigateTo('chat-page', messageSenderId));
    }, error => {
        alert(error);
    });
}

export function alertFriendConfirmation(friendName) {
    var randomNotificationId = getRandomInt(1, 5000);

    // update main page content, if the user is on the main page    
    if (frameModule.topmost().currentEntry.moduleName === 'views/main-page/main-page') {
        frameModule.topmost().currentPage.notify({
            eventName: 'refreshData',
            object: this
        });
    }

    LocalNotifications.schedule([{
        id: randomNotificationId,
        title: 'Squeak',
        body: friendName + ' is now your Friend!'
    }]).then(() => {
        LocalNotifications.addOnMessageReceivedCallback(() => navigateTo('main-page'));
    }, error => {
        alert(error);
    });
}

export var alertFriendRequest = function (friendName): Promise<Boolean> {
    return new Promise((resolve, reject) => {
        var randomNotificationId = getRandomInt(1, 5000);

        LocalNotifications.schedule([{
            id: randomNotificationId,
            title: 'Squeak',
            body: friendName + ' wants to be your Friend!'
        }]).then(() => {
            LocalNotifications.addOnMessageReceivedCallback(() => {
                navigateTo('main-page');
                dialogs.confirm({
                    title: "Do you want to allow " + friendName + " to send you messages?",
                    okButtonText: "Yes please!",
                    cancelButtonText: "Maybe Not..."
                }).then(result => {
                    // Boolean
                    resolve(result);
                });
            });
        }, error => {
            alert(error);
        });
    });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}