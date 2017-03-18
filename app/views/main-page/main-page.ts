import { EventData, Observable } from 'data/observable';
import { ObservableArray } from 'data/observable-array';
import { Page } from 'ui/page';
import { ListView } from 'ui/list-view';

import { Friend } from '../../app-data-model';
import { navigateTo } from '../../app-navigation';

import { setStatusBarColorsIOS } from '../../shared/status-bar-util';

class PageModel extends Observable {

    // define Observables    
    public myFriends: ObservableArray<Friend>

    constructor() {
        super();
        // initialise Observables
        this.myFriends = new ObservableArray<Friend>([
            new Friend('First Friend'),
            new Friend('Second Friend')
        ]);
    }

    // define Actions on the model / Observables here    
    public addFriend() {
        this.myFriends.push(new Friend('New Test Friend'));
    }

    goToSettings(args: EventData) {
        navigateTo('settings-page');
    }

    goToChat(args) {
        var chatTitle = this.myFriends.getItem(args.index).nickname;
        navigateTo('chat-page', chatTitle);
    }
};

// bind the Page template to the Data Model from above
export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel;

    // This makes the phone Status Bar the same color as the app Action Bar (??)
    // page.style.marginTop = -20;
    // page.style.paddingTop = 20;
    // setStatusBarColorsIOS();
}

// add generic Page functionality
