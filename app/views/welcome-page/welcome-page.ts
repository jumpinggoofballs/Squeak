import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';

import { navigateToRoot } from '../../app-navigation';
import { AppData } from '../../data/app-store';

class PageModel extends Observable {

    private appData;
    private introTextVisibility;
    private spinnerVisible;
    private generateRandomFirebaseUserTextVisibility;
    private saveRandomUserLocallyUserTextVisibility;
    private userCreatedSuccessfullyTextVisibility;
    private errorMessageTextVisibility;
    private errorText;

    constructor() {
        super();

        this.spinnerVisible = false;
        this.introTextVisibility = 'visible';
        this.generateRandomFirebaseUserTextVisibility = 'collapsed';
        this.saveRandomUserLocallyUserTextVisibility = 'collapsed';
        this.userCreatedSuccessfullyTextVisibility = 'collapsed';
        this.errorMessageTextVisibility = 'collapsed';
        this.errorText = '';
    }

    initFirebase() {
        this.set('introTextVisibility', 'collapsed');
        this.set('spinnerVisible', true);

        const appData = new AppData();

        appData.generateRandomFirebaseUser()
            .then(user => {
                this.set('generateRandomFirebaseUserTextVisibility', 'visible');

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
                        this.set('errorText', error);
                        this.set('errorMessageTextVisibility', 'visible')
                    });

            }, error => {
                this.set('errorText', error);
                this.set('errorMessageTextVisibility', 'visible')
            });
    }

    goToStartPage() {
        navigateToRoot();
    }
}

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel;
}