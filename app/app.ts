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

// Initialise Couchbase and Firebase + Notifications listeners
import { initAppData } from './data/app-store';
initAppData();

// Start Application
application.start();

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
