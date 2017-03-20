import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import { navigateBack } from '../../app-navigation';

import * as appStore from '../../data/app-store';

class PageModel extends Observable {

    private chatRef: string;
    public chatName: string;

    constructor(chatRef: string) {
        super();
        this.chatName = 'Chat';
        this.chatRef = chatRef;

        this.getPageData(chatRef);
    }

    private getPageData(friendRef) {
        appStore.getFriendsList()
            .then(friendsList => {
                var thisFriend = friendsList[friendRef];
                this.set('chatName', thisFriend.nickname);
            })
    }

    public removeFriend() {
        var chatRef = parseInt(this.chatRef);
        navigateBack();
        appStore.removeFriend(chatRef);
    }

    public goBack() {
        navigateBack();
    }
}

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page.navigationContext.chatRef);
}
