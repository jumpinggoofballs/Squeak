import { Friend, Message } from './app-data-model';

///////////////////////
// API:
// 
// initFriendsData().then(<do stuff>)                                                   -- initalises the Database and the Friends Data Table
// getFriendsList().then( friendsList => { <do stuff with friendsList Array> } )        -- gets the friendsList as an Array
// addFriend(<friend nickname>).then( logMessage => {<optional>})                       -- adds a Friend to the Friends Data Table
// removeFriend(<friend _id>).then( logMessage => {<optional>})                         -- adds a Friend to the Friends Data Table
// editFriend(<friend _id>, <new data content>).then( logMessage => {<optional>})       -- adds a Friend to the Friends Data Table
// 
///////////////////////


// Couchbase initial configuration
import { Couchbase } from 'nativescript-couchbase';
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

        // If the database has already been initialised, resolve and get on with it
        if (appDocumentRef) {
            resolve('App Data already initialised.');
        }

        // Else create the initialisation document
        else {
            database.createDocument({
                appName: 'Squeak',
                settings: {}
            }, 'squeak-app');

            resolve('App Data created anew.');
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

        var newFriend = {
            ...new Friend(nickname),
            documentType: 'Friend'
        }
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

export var editFriend = function (targetId: string, newProperties: Object): Promise<{ logMessage: string }> {
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