// Application settings
import application = require('application');
application.mainModule = './views/main-page/main-page';
application.cssFile = './app.css';

// MomentJS made available globally
import moment = require("moment");
function fromNow(value: Date): any {
    if (value) {
        return moment(value).fromNow();
    }
}
application.resources['fromNow'] = fromNow;

// Initialise Firebase + Notifications
import * as notificationService from './data/notification';

import firebase = require("nativescript-plugin-firebase");
firebase.init({
    onPushTokenReceivedCallback: function (token) {
        console.log("Firebase push token: " + token);
    },
    onMessageReceivedCallback: function (message: any) {
        // not needed -- FCM already pops up a notification. But I will want to suppress that and do my own AFTER decryption.
        // notificationService.notificationListenerInit();
        // notificationService.alertNow(message.body);
    }
}).then(
    (instance) => {
        // console.log("Firebase initialised successfully.");
    },
    (error) => {
        console.log("firebase.init error: " + error);
    }
    );

// Start Application
application.start();

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
