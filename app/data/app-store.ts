import { Friend } from './app-data-model';

///////////////////////
// API:
// 
// initFriendsData.then(<do stuff>)                                                     -- initalises the Database and the Friends Data Table
// getFriendsList.then( friendsList => { <do stuff with friendsList Array> } )          -- gets the friendsList as an Array
// addFriend(<friend nickname>).then( logMessage => {<optional>})                       -- adds a Friend to the Friends Data Table
// removeFriend(<friend index in Array>).then( logMessage => {<optional>})              -- adds a Friend to the Friends Data Table
// 
///////////////////////


// Couchbase initial configuration
import { Couchbase } from 'nativescript-couchbase';
const DB_config = {
    db_name: 'couchbase.db',
}

var database = new Couchbase(DB_config.db_name);
var appDocumentRef = database.getDocument('squeak-app');

//////////////////////////////
// Utility functions exposed to all other Views, which abstract away completely from the DB backend. 
//////////////////////////////

// 1. Simple instructions which do not require paramenters

export var initAppData = function (): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {
        if (appDocumentRef) {
            resolve('App Data already initialised.');
        }
        else {
            database.createDocument({
                appName: 'Squeak',
                settings: {},
                friendsList: []
            }, 'squeak-app')
            resolve('App Data created anew.');
        }
    });
}

export var getFriendsList = function (): Promise<{ friendsList: Array<Object> }> {
    return new Promise((resolve, reject) => {
        var friendsListQuery = database.getDocument('squeak-app').friendsList;
        if (friendsListQuery) {
            resolve(friendsListQuery);
        }
        else {
            reject('Could not obtain List of Friends from Database');
        }
    });
}

// 2. More complex operations that do require parameters

export var addFriend = function (nickname: string): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        var newAppDocument = appDocumentRef;
        var newFriendsList = database.getDocument('squeak-app').friendsList;
        var newFriend = new Friend(nickname);

        newFriendsList.push(newFriend);
        newAppDocument.friendsList = newFriendsList;
        database.updateDocument('squeak-app', newAppDocument);

        resolve('Added New Friend');
    });
}

export var removeFriend = function (targetIndex: number): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        var newAppDocument = appDocumentRef;
        var newFriendsList = database.getDocument('squeak-app').friendsList;

        newFriendsList.splice(targetIndex, 1);
        newAppDocument.friendsList = newFriendsList;
        database.updateDocument('squeak-app', newAppDocument);

        resolve('Removed Friend');
    });
}