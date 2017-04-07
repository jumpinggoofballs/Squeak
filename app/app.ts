// Application settings
import application = require('application');
application.cssFile = './app.css';

// MomentJS made available globally
import moment = require("moment");
function fromNow(value: Date): any {
    if (value) {
        return moment(value).fromNow();
    }
}
application.resources['fromNow'] = fromNow;

// Conditionally Load / Initialise Couchbase and Firebase + Notifications listeners, and navigate to the right screen
import { checkAppDataAlreadyInitialised, AppData } from './data/app-store';

if (checkAppDataAlreadyInitialised()) {
    application.mainModule = './views/main-page/main-page';
    const appData = new AppData();
    appData.startAppData();
} else {
    application.mainModule = './views/welcome-page/welcome-page';
};

// Conditionally Start Application
application.start();

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
