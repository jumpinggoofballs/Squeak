// import * as application from "application";
// import * as platform from "platform";
// import * as utils from "utils/utils";

// declare var android: any;
import { isIOS } from 'platform';
import { topmost } from 'ui/frame';

export function setStatusBarColorsIOS() {

    if (isIOS) {
        topmost().ios.controller.navigationBar.barStyle = 1;
    }
}