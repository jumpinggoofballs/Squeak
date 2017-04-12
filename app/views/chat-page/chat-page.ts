import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import { ListView } from 'ui/list-view';
import * as timer from 'timer';

import * as appStore from '../../data/app-store';
import { navigateBack } from '../../app-navigation';
// import { cancelNotification } from '../../data/notification';

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

        pageRef.on('newMessageReceived', args => {
            this.getPageData();
            this.reScrollWithDelay();
            // cancelNotification(args.object);         // also cancels when the app is minimised
        });
    }

    private getPageData() {
        var friendRef = this.pageRef.navigationContext.chatRef;
        var thisChatFriend = appStore.getFriend(friendRef);
        this.set('thisFriend', thisChatFriend);

        // then mark all messages as read (locally)
        thisChatFriend.unreadMessagesNumber = 0;
        appStore.updateFriend(friendRef, thisChatFriend);
    }

    public reScrollWithDelay() {
        timer.setTimeout(() => {
            this.scrollMessagesList('animate');
        }, 800);
    }

    public goBack() {
        navigateBack();
    }

    public scrollMessagesList(animate?: string) {
        var listViewRef = <ListView>this.pageRef.getViewById('messagesList');
        if (listViewRef.android && (animate === 'animate')) {
            listViewRef.android.smoothScrollToPosition(this.thisFriend.messages.length - 1);
        } else {
            listViewRef.scrollToIndex(this.thisFriend.messages.length - 1);
        }
    }

    public sendMessage() {
        if (this.newMessageText) {
            appStore.sendMessage(this.thisFriend._id, this.newMessageText)
                .then(() => {
                    this.set('newMessageText', '');
                    this.getPageData();
                    this.reScrollWithDelay();
                    this.pageRef.getViewById('newMessageInput').dismissSoftInput();
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