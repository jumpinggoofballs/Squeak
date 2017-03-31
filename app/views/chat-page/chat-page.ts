import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import { ListView } from 'ui/list-view';
import { navigateBack } from '../../app-navigation';
import * as timer from 'timer';

import * as appStore from '../../data/app-store';

class PageModel extends Observable {

    private thisFriend: any;
    private pageRef: any;
    public newMessageText: string;

    constructor(pageRef: any) {
        super();
        this.pageRef = pageRef;
        this.newMessageText = '';
        this.getPageData();
        this.scrollMessagesList();
    }

    private getPageData() {
        var friendRef = this.pageRef.navigationContext.chatRef;
        var thisChatFriend = appStore.getFriend(friendRef);
        this.set('thisFriend', thisChatFriend);
    }

    public reScrollWithDelay() {
        timer.setTimeout(() => {
            this.scrollMessagesList();
        }, 800);
    }

    public goBack() {
        navigateBack();
    }

    public scrollMessagesList() {
        var listViewRef = <ListView>this.pageRef.getViewById('messagesList');
        listViewRef.android.smoothScrollToPosition(this.thisFriend.messages.length - 1);
    }

    public sendMessage() {
        if (this.newMessageText) {
            appStore.sendMessage(this.thisFriend._id, this.newMessageText)
                .then(() => {
                    this.set('newMessageText', '');
                    this.getPageData();
                    this.reScrollWithDelay();
                });
        }
    }

    public removeFriend() {
        navigateBack();
        appStore.removeFriend(this.thisFriend._id);
    }
}

// Mount the Page Model onto the xml View
export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page);
}