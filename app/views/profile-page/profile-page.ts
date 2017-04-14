import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';

import { navigateBack } from '../../app-navigation';
import { getFriend, updateFriend } from '../../data/app-store';

class PageModel extends Observable {

    private pageRef;
    private avatarPath;
    private nicknameEditMode;
    public thisFriend;


    constructor(pageRef: any) {
        super();

        this.pageRef = pageRef;
        this.avatarPath = '~/images/avatar.png';
        this.nicknameEditMode = false;
        this.thisFriend = {}

        this.getPageData();
    }

    getPageData() {
        var friendRef = this.pageRef.navigationContext.chatRef;
        this.set('thisFriend', getFriend(friendRef));
    }

    toggleNicknameEdit() {
        this.set('nicknameEditMode', !this.nicknameEditMode);
        this.pageRef.getViewById('submit').focus();
    }

    saveNickname() {
        updateFriend(this.thisFriend._id, this.thisFriend).then(() => {
            this.getPageData();
            this.toggleNicknameEdit();
            this.pageRef.getViewById('submit').dismissSoftInput();
        });
    }

    goBack() {
        navigateBack();
    }
}

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page);
}