import * as firebase from 'nativescript-plugin-firebase';
import { Couchbase } from 'nativescript-couchbase';

import { Friend, Message } from './app-data-model';
import * as notificationService from './notification';

///////////////////////
// API:
// 
// initFriendsData().then(<do stuff>)                                                   -- initalises the Database and the Friends Data Table
// getFriendsList().then( friendsList => { <do stuff with friendsList Array> } )        -- gets the friendsList as an Array
// addFriend(<friend nickname>).then( logMessage => {<optional>})                       -- adds a Friend to the Friends Data Table
// removeFriend(<friend _id>).then( logMessage => {<optional>})                         -- adds a Friend to the Friends Data Table
// updateFriend(<friend _id>, <new data content>).then( logMessage => {<optional>})     -- adds a Friend to the Friends Data Table
// 
///////////////////////


// Couchbase initial configuration
const DB_config = {
    db_name: 'couchbase.db',
}
var database = new Couchbase(DB_config.db_name);

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

        // 1. Initialise / fetch the local Couchbase database and create an app settings document
        var appDocumentRef = database.getDocument('squeak-app');

        // 2. Initialise Firebase + get push messaging token + set up message received handling
        var firebaseMessagingToken;
        var userUID;
        firebase.init({

            onMessageReceivedCallback: function (message: any) {
                retrieveMessage(message.targetUser, message.messageToFetchRef)
                    .then(sender => {
                        notificationService.notificationListenerInit(sender.id);
                        notificationService.alertNow(sender.nickname);
                    });
            },

            onPushTokenReceivedCallback: function (token) {

                firebaseMessagingToken = token;

                // If the Couchbase database has already been initialised, re-login with Firebase and resolve
                if (appDocumentRef) {
                    // Connect to firebase and log in with Annonymous Login
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
                    var randomEmail = getRandomishString() + '@' + getRandomishString() + '.com';
                    var randomPassword = getRandomishString() + getRandomishString();

                    console.log('creating user... ');
                    firebase.createUser({
                        email: randomEmail,
                        password: randomPassword
                    }).then(user => {

                        console.log('user created. creating local document... ');
                        userUID = user.key;
                        database.createDocument({
                            appName: 'Squeak',
                            settings: {
                                firebaseUID: userUID,
                                fcmMessagingToken: firebaseMessagingToken,
                                randomIdentity: {
                                    email: randomEmail,
                                    password: randomPassword
                                }
                            }
                        }, 'squeak-app');

                        console.log('local document created. setting key values to firebase...');
                        firebase.setValue(
                            '/users/' + userUID,
                            {
                                k: '',
                                t: firebaseMessagingToken,
                                x: [],
                                z: []
                            }
                        ).then(() => {

                            console.log('values set to firebase. Init success!');
                            alert('New Anonymous identity created!');
                            resolve('App Data initialised.');
                        }, error => {
                            alert('Failed to register Anonymous identity on remote servers ' + error);
                        });
                    }, error => {
                        alert('Failed to Initialise local Coucbase data: ' + error);
                    });
                }
            }
        }).then(instance => {

        }, error => {
            alert("Firebase failed to Initialise: " + error);
        });
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
        database.createDocument(newFriend, 'qwucLynmR4diFTHr2SRevheaS1M2');

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
        var newFriendDocument = database.getDocument(chatId);
        var newMessage = new Message(messageText, true);

        // store the message in memory        
        newMessage.messageTimeSent = new Date();
        newMessage.messageStatus = 'Sending...';
        var newMessageIndex = newFriendDocument.messages.push(newMessage);
        database.updateDocument(chatId, newFriendDocument);

        // push message to firebase
        firebase.push(
            '/users/' + newFriendDocument._id + '/z',
            {
                messageAuthor: database.getDocument('squeak-app').settings.firebaseUID,
                messageText: newMessage.messageText,
                messageTimeSent: firebase.ServerValue.TIMESTAMP
            }
        )
            // then push notification of the message sent    
            .then(pushResponse => {
                const sentMessageRef = pushResponse.key;
                firebase.push(
                    'notifications',
                    {
                        messageRef: sentMessageRef,
                        targetUser: newFriendDocument._id
                    }
                )

                    //then update the local state    
                    .then(() => {
                        newFriendDocument.messages[newMessageIndex - 1].messageStatus = "Sent";
                        database.updateDocument(chatId, newFriendDocument);
                        resolve('Message Sent');

                    }, error => {
                        newFriendDocument.messages[newMessageIndex - 1].messageStatus = "Failed";
                        database.updateDocument(chatId, newFriendDocument);
                        alert(error);
                        reject();
                    });

            }, error => {
                newFriendDocument.messages[newMessageIndex - 1].messageStatus = "Failed";
                database.updateDocument(chatId, newFriendDocument);
                alert(error);
                reject();
            });
    });
}

var retrieveMessage = function (targetUser: string, messageRef: string): Promise<{ id: string, nickname: string }> {
    return new Promise((resolve, reject) => {
        var myMessagePath = 'users/' + targetUser + '/z/' + messageRef;
        firebase.addValueEventListener(snapshot => {
            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.      
            if (snapshot.value) {
                var received = snapshot.value;

                // create new Message() for local consumption
                var newMessage = new Message('', false);
                newMessage.messageText = received.messageText;
                newMessage.messageTimeSent = new Date(received.messageTimeSent);
                newMessage.messageTimeReceived = new Date();

                var targetFriend = getFriend(received.messageAuthor);
                targetFriend.messages.push(newMessage);
                targetFriend.timeLastMessage = newMessage.messageTimeReceived;
                targetFriend.lastMessagePreview = received.messageText;             // this could be trimmed or something
                targetFriend.unreadMessagesNumber += 1;

                console.dump(snapshot);

                database.updateDocument(received.messageAuthor, targetFriend);
                firebase.setValue(myMessagePath, null).then(() => {
                    resolve({
                        id: received.messageAuthor,
                        nickname: targetFriend.nickname
                    });
                });
            }
        }, myMessagePath)
            .catch(error => {
                alert(error);
                reject();
            });
    });
}


// Random utility functions

function getRandomishString() {
    return Math.random().toString(36).slice(2);
}