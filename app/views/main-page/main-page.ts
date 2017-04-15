import { EventData, Observable } from 'data/observable';
import { ObservableArray } from 'data/observable-array';
import { Page } from 'ui/page';
import { ListView } from 'ui/list-view';

import { Friend } from '../../data/app-data-model';
import * as appStore from '../../data/app-store';
import { navigateTo } from '../../app-navigation';

import * as forge from 'node-forge';

class PageModel extends Observable {

    private pageRef;
    public myFriends: ObservableArray<Object>;

    constructor(pageRef) {
        super();

        this.pageRef = pageRef;
        this.myFriends = new ObservableArray([]);

        this.populateFriendsList();
        // this.play();

        pageRef.on('refreshData', () => this.populateFriendsList());
    }

    play() {
        var message = 'hello';
        console.log(message + '\n');

        var keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });

        var pem = forge.pki.publicKeyToPem(keypair.publicKey);
        console.log(pem + '\n');

        var publicKey = forge.pki.publicKeyFromPem(pem);
        var encrypted = publicKey.encrypt(message);
        console.log(encrypted + '\n');

        var decrypted = keypair.privateKey.decrypt(encrypted);
        console.log(decrypted + '\n');

    }

    private populateFriendsList() {
        appStore.getFriendsList()
            .then(friendsList => {
                this.set('myFriends', friendsList);
            }, error => {
                alert(error);
            });
    }


    public addFriend() {
        navigateTo('add-friend-page');
    }

    public goToSettings(args: EventData) {
        navigateTo('settings-page');
    }

    // ListView:itemTap and GridView are not playing nicely with each other so this has been taken out of here and implemented as a GridView:tap below 
    // public goToChat(args) {
    //     navigateTo('chat-page', this.myFriends[args.index]._id);
    // }
};


// init the Friends data from the appStore and bind the PageModel to the page;
export function pageLoaded(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = new PageModel(page);
}

export function goToChat(args) {
    navigateTo('chat-page', args.object.itemRef);
}