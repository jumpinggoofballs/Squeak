import { EventData } from 'data/observable';
import { MainPageModel } from './main-page-model';
import { Page } from 'ui/page';

export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new MainPageModel;
}

export function navigateToSettings(args: EventData) {
    console.log('cog clicked');
}