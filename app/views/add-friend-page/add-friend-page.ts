import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import * as SocialShare from "nativescript-social-share";

import { fetchLocalAccountDetails, addFriend } from '../../data/app-store';
import { initNavigation, navigateBack } from '../../app-navigation';

class PageModel extends Observable {

    private friendNickname;
    private friendCode;
    private myCode;
    private tab;

    constructor() {
        super();

        this.friendNickname = '';
        this.friendCode = '';
        this.myCode = '';
        this.tab = 1;

        this.setLocalAccountDetails();
    }

    setLocalAccountDetails() {
        var localAccountDocument = fetchLocalAccountDetails();
        this.set('myCode', localAccountDocument.settings.firebaseUID);
    }

    addFriend() {
        addFriend(this.friendNickname, this.friendCode)
            .then(() => {
                initNavigation();
            }, error => {
                alert(error);
            });
    }

    tab1() {
        this.set('tab', 1);
    }

    tab2() {
        this.set('tab', 2);
    }

    shareCode() {
        SocialShare.shareText('Hey, my Squeak code is: ' + this.myCode);
    }

    goBack() {
        navigateBack();
    }
}

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel;
}