import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import * as SocialShare from "nativescript-social-share";

import { navigateBack } from '../../app-navigation';
import { fetchLocalAccountDetails, updateLocalNickname } from '../../data/app-store';

class PageModel extends Observable {

    private pageRef;
    private nickname;
    private avatarPath;
    private nicknameEditMode;
    private myCode;

    constructor(pageRef: any) {
        super();

        this.pageRef = pageRef;
        this.nickname = 'Squaaaaa';
        this.avatarPath = '~/images/avatar.png';
        this.nicknameEditMode = false;
        this.myCode = '';

        this.setLocalAccountDetails();
    }

    setLocalAccountDetails() {
        var localAccountDocument = fetchLocalAccountDetails();
        this.set('nickname', localAccountDocument.settings.nickname);
        this.set('avatarPath', localAccountDocument.settings.avatarPath);
        this.set('myCode', localAccountDocument.settings.firebaseUID);
    }

    toggleNicknameEdit() {
        this.set('nicknameEditMode', !this.nicknameEditMode);
        this.pageRef.getViewById('goofball').focus();
    }

    saveNickname() {
        updateLocalNickname(this.nickname);
        this.toggleNicknameEdit();
        this.pageRef.getViewById('goofball').dismissSoftInput();
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
    page.bindingContext = new PageModel(page);
}