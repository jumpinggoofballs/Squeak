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

var appDocumentRef = database.getDocument('squeak-app');

export function checkAppDataAlreadyInitialised(): Boolean {
    if (appDocumentRef) return true;
    return false;
}

export class AppData {

    private firebaseInit = function (): Promise<{ token: string }> {
        return new Promise((resolve, reject) => {
            firebase.init({

                onMessageReceivedCallback: function (notification: any) {
                    if (notification.messageToFetchRef) {
                        retrieveMessage(notification.targetUser, notification.messageToFetchRef)
                            .then(sender => {
                                notificationService.alertNewMessage(sender.nickname, sender.id);
                            });
                    }

                    if (notification.myDetails) {
                        handleAddFriendNotification(notification.notificationId, notification.myDetails);
                    }
                },

                onPushTokenReceivedCallback: function (token) {
                    resolve(token);
                }
            }).then(() => {
                //
            }, error => {
                alert(error);
            });
        });
    }

    public startAppData() {
        return new Promise((resolve, reject) => {

            this.firebaseInit().then(firebaseMessagingToken => {
                firebase.login({
                    type: firebase.LoginType.PASSWORD,
                    email: appDocumentRef.settings.randomIdentity.email,
                    password: appDocumentRef.settings.randomIdentity.password
                })
                    .then(user => {

                    }, error => {
                        alert('Error: ' + error);
                    });
                resolve('App Initialised!');           // do not wait for firebase - user should be able to see local data
            })
        });
    }

    public generateRandomFirebaseUser() {
        return new Promise((resolve, reject) => {

            database.deleteDocument('squeak-app');

            this.firebaseInit().then(firebaseMessagingToken => {
                var randomEmail = getRandomishString() + '@' + getRandomishString() + '.com';
                var randomPassword = getRandomishString() + getRandomishString();

                firebase.createUser({
                    email: randomEmail,
                    password: randomPassword
                }).then(user => {
                    resolve({
                        firebaseUID: user.key,
                        email: randomEmail,
                        password: randomPassword,
                        firebaseMessagingToken: firebaseMessagingToken
                    });
                }, error => {
                    alert('Failed to register Anonymous identity on remote servers ' + error);
                });
            });
        });
    }

    public saveRandomUserLocally(user) {
        return new Promise((resolve, reject) => {
            database.createDocument({
                appName: 'Squeak',
                settings: {
                    avatarPath: '~/images/avatar.png',
                    nickname: 'Squeak',
                    firebaseUID: user.firebaseUID,
                    fcmMessagingToken: user.firebaseMessagingToken,
                    randomIdentity: {
                        email: user.email,
                        password: user.password
                    }
                }
            }, 'squeak-app');
            resolve({
                userUID: user.firebaseUID,
                firebaseMessagingToken: user.firebaseMessagingToken
            });
        });
    }

    public updateFirebaseRecords(user) {
        return new Promise((resolve, reject) => {
            firebase.setValue(
                '/users/' + user.userUID,
                {
                    k: '',
                    t: user.firebaseMessagingToken,
                    x: [],
                    z: []
                }
            ).then(() => {
                resolve('App Data initialised.');
            }, error => {
                alert('Failed to set User details on remote servers ' + error);
            });
        });
    }
}


// Local account related data

export function fetchLocalAccountDetails() {
    return database.getDocument('squeak-app');
}

export function updateLocalNickname(nickname) {
    var localSettingsDocument = database.getDocument('squeak-app');
    localSettingsDocument.settings.nickname = nickname;
    database.updateDocument('squeak-app', localSettingsDocument);
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

export var addFriend = function (firebaseId: string): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        var myProfile = database.getDocument('squeak-app').settings;
        var path = '/users/' + myProfile.firebaseUID + '/x';

        // add this user code / firebase Id to the list of people who can message me
        firebase.push(
            path,
            firebaseId
        ).then(() => {

            // notify friend with our own details
            var encryptedMyDetails = JSON.stringify({
                // to be encrypted
                nickname: myProfile.nickname,
                firebaseId: myProfile.firebaseUID
                // avatar:
            });

            firebase.push(
                'notifications',
                {
                    targetUser: firebaseId,
                    myDetails: encryptedMyDetails
                }
            ).then(() => {

                var friendRef = database.getDocument(firebaseId);

                // if friendRef does not exist, initialise temporary values
                if (!friendRef) {

                    //   Set preliminary details details for friend
                    var newFriend = new Friend('Pending');
                    newFriend.lastMessagePreview = 'Waiting for friend confirmation... (code: ' + firebaseId + ')';
                    database.createDocument(newFriend, firebaseId);
                }
                resolve('Added New Friend');
            });
        });
    });
}

function handleAddFriendNotification(notificationId, encryptedFriendDetails) {

    var friend = JSON.parse(encryptedFriendDetails);

    let localFriendRef = database.getDocument(friend.firebaseId);

    // if we already have a record for that friend (i.e. they gave us the code), update the Friend record
    if (localFriendRef) {
        localFriendRef.nickname = friend.nickname;
        localFriendRef.lastMessagePreview = 'New Friend';
        database.updateDocument(friend.firebaseId, localFriendRef);

        notificationService.alertFriendConfirmation(friend.nickname);
    } else {

        // if we do not have a record for that friend (i.e. we gave them the code), request permission to add them to our friends list
        notificationService.alertFriendRequest(friend.nickname)
            .then(confirmation => {
                // if we receive a true value (== accept) from the Promise
                if (confirmation) {

                    // add Friend record with initial values
                    addFriend(friend.firebaseId).then(() => {

                        // then update with the actual values
                        let localFriendRef = database.getDocument(friend.firebaseId);
                        localFriendRef.nickname = friend.nickname;
                        localFriendRef.lastMessagePreview = 'New Friend';
                        database.updateDocument(friend.firebaseId, localFriendRef);

                        notificationService.alertFriendConfirmation(friend.nickname);
                    });
                }
            });
    }

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
                        messageToFetchRef: sentMessageRef,
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