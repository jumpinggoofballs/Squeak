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

// Initialise Firebase
import firebase = require("nativescript-plugin-firebase");
firebase.init({
    // Optionally pass in properties for database, authentication and cloud messaging
    // This is not needed here because of we have the Android/iOS config jsons from the Firebase dashboard
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
