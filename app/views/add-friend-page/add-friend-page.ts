import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import { navigateBack } from '../../app-navigation';

import * as appStore from '../../data/app-store';
import * as bluetooth from '../../data/bluetooth';

class PageModel extends Observable {

    addFriend() {
        appStore.addFriend('Test friend')
            .then(() => {
                //
            }, error => {
                alert(error);
            });
    }

    scanForFriend() {
        bluetooth.init().then(result => {
            alert(result);
        });
    }

    goBack() {
        navigateBack();
    }
}

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel;
}