import { EventData, Observable } from 'data/observable';
import { ObservableArray } from 'data/observable-array';
import { Page } from 'ui/page';
import { ListView } from 'ui/list-view';

import { Friend } from '../../data/app-data-model';
import * as appStore from '../../data/app-store';
import { navigateTo } from '../../app-navigation';
// import { cancelNotification } from '../../data/notification';

class PageModel extends Observable {

    private pageRef;
    public myFriends: ObservableArray<Object>;

    constructor(pageRef) {
        super();

        this.pageRef = pageRef;
        this.myFriends = new ObservableArray([]);

        this.populateFriendsList();

        pageRef.on('refreshData', args => {
            this.populateFriendsList();
            // cancelNotification(args.object);         // also cancels when the app is minimised
        });
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
        navigateTo('add-friend-page');
    }

    public goToSettings(args: EventData) {
        navigateTo('settings-page');
    }

    // ListView:itemTap and GridView are not playing nicely with each other so this has been taken out of here and implemented as a GridView:tap 
    // public goToChat(args) {
    //     navigateTo('chat-page', this.myFriends[args.index]._id);
    // }
};


// init the Friends data from the appStore and bind the PageModel to the page;
export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page);
}

export function goToChat(args) {
    navigateTo('chat-page', args.object.itemRef);
}