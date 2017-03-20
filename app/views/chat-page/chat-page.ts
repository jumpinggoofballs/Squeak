import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import { navigateBack } from '../../app-navigation';

import * as appStore from '../../data/app-store';

class PageModel extends Observable {

    private thisFriend: any;
    public newMessageText: string;

    constructor(chatRef: string) {
        super();

        this.newMessageText = '';
        this.getPageData(chatRef);
    }

    private getPageData(friendRef) {
        var thisChatFriend = appStore.getFriend(friendRef);
        this.set('thisFriend', thisChatFriend);
    }

    public removeFriend() {
        navigateBack();
        appStore.removeFriend(this.thisFriend._id);
    }

    public goBack() {
        navigateBack();
    }

    public sendMessage() {
        appStore.sendMessage(this.thisFriend._id, this.newMessageText)
            .then(() => {
                this.set('newMessageText', '');
                this.getPageData(this.thisFriend._id);
            });
    }
}

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page.navigationContext.chatRef);
}
