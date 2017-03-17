import application = require('application');
application.mainModule = './views/main-page/main-page';
application.cssFile = './app.css';

application.start();

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
