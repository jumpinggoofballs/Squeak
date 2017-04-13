import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import { ListView } from 'ui/list-view';
import * as dialogs from 'ui/dialogs'
import * as timer from 'timer';

import * as appStore from '../../data/app-store';
import { navigateBack } from '../../app-navigation';

class PageModel extends Observable {

    private thisFriend: any;
    private pageRef: any;
    private listViewRef: any;
    public newMessageText: string;

    constructor(pageRef: any) {
        super();
        this.pageRef = pageRef;
        this.listViewRef = <ListView>this.pageRef.getViewById('messagesList');
        this.newMessageText = '';
        this.getPageData();
        this.scrollMessagesList();

        pageRef.on('newMessageReceived', () => {
            this.getPageData();
            this.reScrollWithDelay();
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
        if (this.listViewRef.android && (animate === 'animate')) {
            this.listViewRef.android.smoothScrollToPosition(this.thisFriend.messages.length - 1);
        } else {
            this.listViewRef.scrollToIndex(this.thisFriend.messages.length - 1);
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

    // not implemented    
    public onMessageTap(args) {
        var thisMessage = this.thisFriend.messages[args.index];

        var author = thisMessage.sourceIsMe ? 'Me' : this.thisFriend.nickname;
        var timeSent = new Date(thisMessage.messageTimeSent).toUTCString();
        var status = thisMessage.status;

        var timeReceived;
        if (thisMessage.messageTimeReceived) {
            timeReceived = new Date(thisMessage.messageTimeReceived).toUTCString();
        } else {
            timeReceived = 'n/a';
        }

        var thisMessageString =
            ('Author: ' + author +
                '\n\nTime Sent: ' + timeSent +
                '\n\nTime Received: ' + timeReceived +
                '\n\nStatus: ' + thisMessage.messageStatus);
        dialogs.alert({
            title: "Message Details",
            message: thisMessageString,
            okButtonText: "Done"
        });
    }
}

// Mount the Page Model onto the xml View
export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page);
}