import { EventData, Observable } from 'data/observable';
import { ObservableArray } from 'data/observable-array';
import { Page } from 'ui/page';
import { ListView } from 'ui/list-view';

import { Friend } from '../../data/app-data-model';
import * as appStore from '../../data/app-store';
import { navigateTo } from '../../app-navigation';

class PageModel extends Observable {

    public myFriends: ObservableArray<Object>;

    constructor() {
        super();

        this.myFriends = new ObservableArray([]);

        this.populateFriendsList();
    }

    private populateFriendsList() {
        appStore.getFriendsList()
            .then(friendsList => {
                this.set('myFriends', friendsList);
            }, error => {
                alert(error);
            });
    }


    public addFriend() {
        appStore.addFriend('Name of Friend to Test 3')
            .then(() => {
                this.populateFriendsList();
            }, error => {
                alert(error);
            });
    }

    public goToSettings(args: EventData) {
        navigateTo('settings-page');
    }

    public goToChat(args) {
        navigateTo('chat-page', args.index.toString());
    }
};

// init the Friends data from the appStore and bind the PageModel to the page;
export function pageLoaded(args: EventData) {

    var page = <Page>args.object;
    appStore.initAppData()
        .then(logMessage => {
            console.log(logMessage);
            page.bindingContext = new PageModel();
        }, error => {
            alert(error);
        });


    // // This makes the phone Status Bar the same color as the app Action Bar (??)
    // import { setStatusBarColorsIOS } from '../../shared/status-bar-util';
    // page.style.marginTop = -20;
    // page.style.paddingTop = 20;
    // setStatusBarColorsIOS();
}
