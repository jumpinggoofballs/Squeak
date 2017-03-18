import { EventData } from 'data/observable';
import { Page } from 'ui/page';
import { navigateBack } from '../../app-navigation';


export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    // page.bindingContext = this;

    page.actionBar.title = page.navigationContext.chatName;
}

export function goBack() {
    navigateBack();
}