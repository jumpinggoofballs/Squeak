import { EventData, Observable } from 'data/observable';
import { Page } from 'ui/page';
import { navigateBack } from '../../app-navigation';

class PageModel extends Observable {

    chatName: string

    constructor(chatName: string) {
        super();
        this.chatName = chatName;
    }

    goBack() {
        navigateBack();
    }
}

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page.navigationContext.chatName);
}
