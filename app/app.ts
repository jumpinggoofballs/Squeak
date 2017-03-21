import application = require('application');
application.mainModule = './views/main-page/main-page';
application.cssFile = './app.css';

import moment = require("moment");
function fromNow(value: Date): any {
    if (value) {
        return moment(value).fromNow();
    }
}

application.resources['fromNow'] = fromNow;

application.start();

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
