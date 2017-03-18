import { EventData, Observable } from 'data/observable';
import { ObservableArray } from 'data/observable-array';
import { Page } from 'ui/page';

import { Friend } from '../../app-data-model';

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
        this.myFriends.push(new Friend('Felix'));
    }
};

// bind the Page template to the Data Model from above
export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel;
    page.style.marginTop = -20;
    page.style.paddingTop = 20;
    setStatusBarColorsIOS();
}

// add generic Page functionality
export function navigateToSettings(args: EventData) {
    console.log('cog clicked');
}