import { EventData, Observable } from 'data/observable';
import { ObservableArray } from 'data/observable-array';
import { Page } from 'ui/page';
import { ListView } from 'ui/list-view';

import { Friend } from '../../data/app-data-model';
import { navigateTo } from '../../app-navigation';

// import { setStatusBarColorsIOS } from '../../shared/status-bar-util';

class PageModel extends Observable {

    public myFriends: ObservableArray<Friend>;
    public dbRef: any;

    constructor(database: any) {
        super();

        this.dbRef = database;

        this.myFriends = new ObservableArray<Friend>();

        this.dbRef.all('SELECT * FROM friends').then(rows => {
            for (var row in rows) {
                this.myFriends.push(new Friend(rows[row][1]));
            }
        }, error => {
            console.log('select error');
        });
    }

    // define Actions on the model / Observables here    
    public addFriend() {
        this.dbRef.execSQL('INSERT INTO friends (nickname) VALUES (?)', ['testy test friend 3']).then(() => {
            this.myFriends.push(new Friend('testy test friend 3'));
        }, error => {
            console.log('insert error');
        });
        console.log(this.dbRef);
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
    var Sqlite = require('nativescript-sqlite');
    (new Sqlite('test.db')).then(db => {
        db.execSQL('CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT)').then(id => {
            page.bindingContext = new PageModel(db);
        }, error => {
            console.log('create table error ' + error);
        });
    }, error => {
        console.log('create db error');
    });
    // page.bindingContext = new PageModel();

    // This makes the phone Status Bar the same color as the app Action Bar (??)
    // page.style.marginTop = -20;
    // page.style.paddingTop = 20;
    // setStatusBarColorsIOS();
}

// add generic Page functionality below
