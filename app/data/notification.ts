import * as LocalNotifications from "nativescript-local-notifications";
import * as frameModule from 'ui/frame';
import * as dialogs from 'ui/dialogs';

import { navigateToRoot } from '../app-navigation';

export function alertNewMessages(messagesArray: Array<Object>) {

    // if the user is on the main page, update the main page with new message badges and the like
    // both references are needed for different versions of android;
    if (frameModule.topmost().currentEntry.moduleName === ('./views/main-page/main-page' || 'views/main-page/main-page')) {
        frameModule.topmost().currentPage.notify({
            eventName: 'refreshData',
            object: this
        })
    } else {

        var currentFriendId = frameModule.topmost().currentEntry.context.chatRef;
        var otherMessages = 0;
        messagesArray.forEach((message: any) => {

            // if we have a currentFriendId (== we are on a chat-page) and we are on the chat page corresponding to this message
            if (currentFriendId === message.messageAuthor) {

                // update the view with animation, etc.
                frameModule.topmost().currentPage.notify({
                    eventName: 'newMessageReceived',
                    object: this
                });
            } else {
                otherMessages += 1;
            }
        });

        // if we do messages corresponding to other pages, trigger loud notification        
        if (otherMessages) {

            var body = '';
            if (otherMessages === 1) {
                body = 'You have a new message';
            } else {
                body = 'You have ' + otherMessages + ' other messages';
            };

            LocalNotifications.schedule([{
                title: 'Squeak',
                body: body
            }]).then(() => {
                LocalNotifications.addOnMessageReceivedCallback(() => navigateToRoot());
            }, error => {
                alert(error);
            });
        }
    }
}

export function refreshMessageStatus(chatId) {
    if (frameModule.topmost().currentEntry.context.chatRef === chatId) {
        frameModule.topmost().currentPage.notify({
            eventName: 'newMessageReceived',
            object: this
        });
    }
}

export function alertFriendConfirmation(friendName) {
    var randomNotificationId = getRandomInt(1, 5000);

    // update main page content, if the user is on the main page    
    if (frameModule.topmost().currentEntry.moduleName === './views/main-page/main-page' || 'views/main-page/main-page') {
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
        LocalNotifications.addOnMessageReceivedCallback(() => navigateToRoot());
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
                navigateToRoot();
                dialogs.confirm({
                    title: "Do you want to allow " + friendName + " to send you messages?",
                    okButtonText: "Yes!",
                    cancelButtonText: "No..."
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