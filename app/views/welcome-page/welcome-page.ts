import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';

import { navigateToRoot } from '../../app-navigation';
import { AppData, fetchLocalAccountDetails, updateLocalNickname } from '../../data/app-store';

class PageModel extends Observable {

    private pageRef;
    private nickname;
    private avatarPath;

    private introTextVisibility;
    private spinnerVisible;
    private generateRandomFirebaseUserTextVisibility;
    private saveRandomUserLocallyUserTextVisibility;
    private userCreatedSuccessfullyTextVisibility;
    private errorMessageTextVisibility;
    private myDetailsVisible;
    private nicknameEditMode;
    private errorText;

    constructor(page) {
        super();

        this.pageRef = page;
        this.nickname = 'Squeak';
        this.avatarPath = '~/images/avatar.png';

        this.spinnerVisible = false;
        this.introTextVisibility = 'visible';
        this.generateRandomFirebaseUserTextVisibility = 'collapsed';
        this.saveRandomUserLocallyUserTextVisibility = 'collapsed';
        this.userCreatedSuccessfullyTextVisibility = 'collapsed';
        this.errorMessageTextVisibility = 'collapsed';
        this.myDetailsVisible = false;
        this.nicknameEditMode = false;
        this.errorText = '';
    }

    initFirebase() {
        this.set('introTextVisibility', 'collapsed');
        this.set('spinnerVisible', true);
        this.set('generateRandomFirebaseUserTextVisibility', 'visible');

        const appData = new AppData();

        appData.generateRandomFirebaseUser()
            .then(user => {

                appData.saveRandomUserLocally(user)
                    .then(userId => {
                        this.set('saveRandomUserLocallyUserTextVisibility', 'visible');

                        appData.updateFirebaseRecords(userId)
                            .then(() => {

                                this.set('spinnerVisible', false);
                                this.set('userCreatedSuccessfullyTextVisibility', 'visible');

                            }, error => {
                                this.set('errorText', error);
                                this.set('errorMessageTextVisibility', 'visible')
                            });

                    }, error => {
                        this.set('spinnerVisible', false);
                        this.set('errorText', error);
                        this.set('errorMessageTextVisibility', 'visible')
                    });

            }, error => {
                this.set('spinnerVisible', false);
                this.set('errorText', error);
                this.set('errorMessageTextVisibility', 'visible')
            });
    }

    toggleNicknameEdit() {
        this.set('nicknameEditMode', !this.nicknameEditMode);
        this.pageRef.getViewById('nicknameInput').focus();
    }

    saveNickname() {
        updateLocalNickname(this.nickname);
        this.toggleNicknameEdit();
        this.pageRef.getViewById('nicknameInput').dismissSoftInput();
    }

    goToMyDetails() {
        this.set('myDetailsVisible', true);
    }

    goToStartPage() {
        navigateToRoot();
    }
}

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page);
}