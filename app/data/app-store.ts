import * as firebase from 'nativescript-plugin-firebase';
import { Couchbase } from 'nativescript-couchbase';

import { Friend, Message } from './app-data-model';

///////////////////////
// API:
// 
// initFriendsData().then(<do stuff>)                                                   -- initalises the Database and the Friends Data Table
// getFriendsList().then( friendsList => { <do stuff with friendsList Array> } )        -- gets the friendsList as an Array
// addFriend(<friend nickname>).then( logMessage => {<optional>})                       -- adds a Friend to the Friends Data Table
// removeFriend(<friend _id>).then( logMessage => {<optional>})                         -- adds a Friend to the Friends Data Table
// updateFriend(<friend _id>, <new data content>).then( logMessage => {<optional>})       -- adds a Friend to the Friends Data Table
// 
///////////////////////


// Couchbase initial configuration
const DB_config = {
    db_name: 'couchbase.db',
}

export var database = new Couchbase(DB_config.db_name);


// Pre-define Queries
database.createView('friends', '1', (document, emitter) => {
    if (document.documentType === 'Friend') {
        emitter.emit(document.timeLastMessage, document);     // call back with this document;
    };
});

//////////////////////////////
// Utility functions exposed to all other Views, which abstract away completely from the DB backend. 
//////////////////////////////


// General App details data and Database initalisation

export var initAppData = function (): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {
        var appDocumentRef = database.getDocument('squeak-app');

        // If the database has already been initialised, re-login with Firebase and resolve
        if (appDocumentRef) {
            // Then connect to firebase and log in with Annonymous Login
            firebase.login({
                type: firebase.LoginType.PASSWORD,
                email: appDocumentRef.settings.randomIdentity.email,
                password: appDocumentRef.settings.randomIdentity.password
            })
                .then(user => {

                }, error => {
                    alert('Error: ' + error);
                });
            resolve('App Data initialised.');           // do not wait for firebase - user should be able to see local data
        }

        // Else create new random/anonymous user, initalise the App Document with those details and proceed
        else {
            var randomEmail = getRandomishString() + '@squeak.com';
            var randomPassword = getRandomishString() + getRandomishString();

            firebase.createUser({
                email: randomEmail,
                password: randomPassword
            })
                .then(user => {
                    database.createDocument({
                        appName: 'Squeak',
                        settings: {
                            randomIdentity: {
                                email: randomEmail,
                                password: randomPassword
                            }
                        }
                    }, 'squeak-app');
                    alert('New Anonymous identity created!');
                    resolve('App Data initialised.');
                }, error => {
                    alert('Error: ' + error);
                });
        }
    });
}


// Friends List related data

export function getFriend(friendId: string) {
    return database.getDocument(friendId);
}

export var getFriendsList = function (): Promise<{ friendsList: Array<Object> }> {
    return new Promise((resolve, reject) => {

        var friendsListQuery = database.executeQuery('friends');
        if (friendsListQuery) {
            resolve(friendsListQuery);
        }
        else {
            reject('Could not obtain List of Friends from Database');
        }
    });
}

export var addFriend = function (nickname: string): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        var newFriend = new Friend(nickname);
        database.createDocument(newFriend);

        resolve('Added New Friend');
    });
}

export var removeFriend = function (targetId: string): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        database.deleteDocument(targetId);

        resolve('Removed Friend');
    });
}

export var updateFriend = function (targetId: string, newProperties: Object): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        database.updateDocument(targetId, newProperties);

        resolve('Edited Friend');
    });
}


// Messages related data

export var sendMessage = function (chatId: string, messageText: string): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {
        var newMessage = new Message(messageText, true);
        var newFriendDocument = database.getDocument(chatId);
        newFriendDocument.messages.push(newMessage);
        database.updateDocument(chatId, newFriendDocument);
        resolve('Sending');
    });
}


// Random utility functions
function getRandomishString() {
    return Math.random().toString(36).slice(2);
}