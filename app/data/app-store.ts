import { Couchbase } from 'nativescript-couchbase';
import * as firebase from 'nativescript-plugin-firebase';
import * as forge from 'node-forge';

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


function resetDatabase() {
    database = database.destroyDatabase();
    database = new Couchbase(DB_config.db_name);
}

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
                    if (notification.m) {
                        retrieveAllMessages().then(messagesArray => notificationService.alertNewMessages(messagesArray));
                    }

                    if (notification.n) {
                        handleAddFriendNotifications();
                    }

                    if (notification.c) {
                        handleMessageReceiptNotification();
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

            resetDatabase();

            this.firebaseInit().then(firebaseMessagingToken => {
                var randomEmail = getRandomishString() + '@' + getRandomishString() + '.com';
                var randomPassword = forge.random.getBytesSync(32);

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

            // generate key pair            
            var keypair = forge.pki.rsa.generateKeyPair({ bits: 4096, e: 0x10001 });
            var privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
            var publicKey = forge.pki.publicKeyToPem(keypair.publicKey);

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
                    },
                    privateKey: privateKey,
                    publicKey: publicKey
                }
            }, 'squeak-app');
            resolve({
                userUID: user.firebaseUID,
                firebaseMessagingToken: user.firebaseMessagingToken,
                publicKey: publicKey
            });
        });
    }

    public updateFirebaseRecords(user) {
        return new Promise((resolve, reject) => {
            firebase.setValue(
                '/u/' + user.userUID,
                {
                    k: user.publicKey,
                    t: user.firebaseMessagingToken,
                    x: [],
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

var getFriendPublicKey = function (firebaseId: string): Promise<string> {
    return new Promise((resolve, reject) => {
        var friendPublicKeyPath = '/u/' + firebaseId + '/k/';
        firebase.addValueEventListener(snapshot => {
            resolve(snapshot.value);
        }, friendPublicKeyPath)
            .catch(error => {
                alert(error);
            });
    });
}

export var getFriendsList = function (): Promise<{ friendsList: Array<Object> }> {
    return new Promise((resolve, reject) => {

        var friendsListQuery = database.executeQuery('friends');
        if (friendsListQuery) {

            var sortedFriendsList = friendsListQuery.sort((a, b) => {
                var dateA = new Date(a.timeLastMessage).valueOf();
                var dateB = new Date(b.timeLastMessage).valueOf();
                return dateB - dateA;                               // newest at the top
            });

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
        var authorisedFriendPath = '/u/' + myProfile.firebaseUID + '/x/' + firebaseId;

        // add this user code / firebase Id to the list of people who can message me
        firebase.setValue(
            authorisedFriendPath,
            true
        ).then(() => {

            // notify friend with our own details
            getFriendPublicKey(firebaseId).then(publicKey => {

                var myDetails = {
                    nickname: myProfile.nickname,
                    firebaseId: myProfile.firebaseUID
                    // avatar:
                };
                var encryptedMyDetails = encrypt(myDetails, publicKey);

                firebase.push(
                    '/n/' + firebaseId,
                    encryptedMyDetails
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
    });
}

var handleAddFriendNotifications = function (): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        var myId = appDocumentRef.settings.firebaseUID;
        var eventListeners;
        var myNotificationsPath = '/n/' + myId;

        firebase.addValueEventListener(snapshot => {

            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.
            if (snapshot.value) {
                var keysArray = Object.keys(snapshot.value);

                keysArray.forEach(key => {
                    var friend = decrypt(snapshot.value[key]);
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
                    };
                });

                firebase.removeEventListeners(eventListeners, myNotificationsPath);
                firebase.setValue(myNotificationsPath, null);
                resolve('All notifications retrieved');

            } else reject('Could not find any notification on Firebase');

        }, myNotificationsPath).then(listenerWrapper => {

            // get eventListeners ref
            eventListeners = listenerWrapper.listeners;
        });
    });
}

export var removeFriend = function (targetId: string): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        // get the path to the permission entry to remove
        var permissionPath = '/u/' + appDocumentRef.settings.firebaseUID + '/x/'
        firebase.query(result => {

            // only get excited if we actually find the permission record
            if (result.value) {
                var target = Object.keys(result.value)[0];  // == the key to the record to remove

                // set the target path to null
                firebase.setValue(permissionPath + target, null).then(() => {

                    // then delete the local record and resolve
                    database.deleteDocument(targetId);
                    resolve('Removed Friend');
                });
            } else {
                database.deleteDocument(targetId);
                resolve('Friend did not have permissions to message you');      // == the firebase record was previously deleted (should not happen)
            }
        },
            permissionPath,
            {
                singleEvent: true,
                orderBy: {
                    type: firebase.QueryOrderByType.VALUE,
                }
            });
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
        newMessage.messageAuthor = database.getDocument('squeak-app').settings.firebaseUID;
        newMessage.messageTimeSent = new Date();
        newMessage.messageStatus = 'Sending...';
        var newMessageIndex = newFriendDocument.messages.push(newMessage);
        database.updateDocument(chatId, newFriendDocument);

        // prepare message for sending
        var message = {
            messageAuthor: newMessage.messageAuthor,
            messageText: newMessage.messageText,
            messageTimeSent: newMessage.messageTimeSent
        };

        // get encryption key
        getFriendPublicKey(chatId).then(publicKey => {

            var encryptedMessage = encrypt(message, publicKey);

            // push message to firebase
            firebase.push(
                '/m/' + newFriendDocument._id,
                encryptedMessage
            )
                //then update the local state    
                .then(confirmation => {
                    newFriendDocument.messages[newMessageIndex - 1].messageStatus = "Sent";
                    newFriendDocument.messages[newMessageIndex - 1].id = confirmation.key;
                    database.updateDocument(chatId, newFriendDocument);
                    resolve('Message Sent');

                }, error => {
                    newFriendDocument.messages[newMessageIndex - 1].messageStatus = "Failed";
                    database.updateDocument(chatId, newFriendDocument);
                    alert(error);
                    reject();
                });
        }).catch(error => {
            alert(error);
        });
    });
}

function retrieveAllMessages(): Promise<Array<Object>> {
    return new Promise((resolve, reject) => {

        var myId = appDocumentRef.settings.firebaseUID;
        var eventListeners;
        var myMessagesPath = '/m/' + myId;

        firebase.addValueEventListener(snapshot => {

            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.
            if (snapshot.value) {

                var messagesArray = [];
                var keysArray = Object.keys(snapshot.value);
                keysArray.forEach(key => {

                    var decryptedMessage = decrypt(snapshot.value[key]);

                    // create new Message() for local consumption
                    var newMessage = new Message('', false);
                    newMessage.id = key;
                    newMessage.messageAuthor = decryptedMessage.messageAuthor;
                    newMessage.messageText = decryptedMessage.messageText;
                    newMessage.messageTimeSent = new Date(decryptedMessage.messageTimeSent);
                    newMessage.messageTimeReceived = new Date();
                    newMessage.messageStatus = 'Received';

                    // save this message to return to the notification handler
                    messagesArray.push(newMessage);

                    // create updated Friend Record
                    var targetFriend = getFriend(decryptedMessage.messageAuthor);

                    targetFriend.messages.push(newMessage);
                    targetFriend.timeLastMessage = newMessage.messageTimeReceived;
                    targetFriend.lastMessagePreview = decryptedMessage.messageText;
                    targetFriend.unreadMessagesNumber += 1;

                    // Then sort the messages. for sorting arrays, see: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
                    targetFriend.messages = targetFriend.messages.sort((a, b) => {
                        var dateA = new Date(a.messageTimeSent).valueOf();
                        var dateB = new Date(b.messageTimeSent).valueOf();
                        return dateA - dateB;
                    });

                    // update the database
                    database.updateDocument(decryptedMessage.messageAuthor, targetFriend);

                    // notify sender of receipt
                    confirmMessageReceipt(myId, decryptedMessage.messageAuthor, newMessage.id, newMessage.messageTimeReceived);
                });

                firebase.removeEventListeners(eventListeners, myMessagesPath);
                firebase.setValue(myMessagesPath, null);
                resolve(messagesArray);

            } else reject('Could not find any message on Firebase');

        }, myMessagesPath).then(listenerWrapper => {

            // get eventListeners ref
            eventListeners = listenerWrapper.listeners;
        });
    });
}

function confirmMessageReceipt(myId, author, messageId, timeReceived) {
    var notificationPath = '/c/' + author;
    var payload = {
        id: messageId,
        sender: myId,
        timeReceived: timeReceived
    };

    getFriendPublicKey(author).then(publicKey => {
        var encryptedPayload = encrypt(payload, publicKey);
        firebase.push(notificationPath, encryptedPayload);
    });
}

function handleMessageReceiptNotification(): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {

        var myId = appDocumentRef.settings.firebaseUID;
        var eventListeners;
        var myConfirmationsPath = '/c/' + myId;

        firebase.addValueEventListener(snapshot => {

            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.
            if (snapshot.value) {

                var keysArray = Object.keys(snapshot.value);
                keysArray.forEach(key => {

                    // for each confirmation logged on firebase, decrypt                    
                    var decryptedConfirmation = decrypt(snapshot.value[key]);
                    var friend = database.getDocument(decryptedConfirmation.sender);

                    // then find the message it relates to and change its status and time received properties                    
                    friend.messages.forEach(message => {
                        if (decryptedConfirmation.id === message.id) {
                            message.messageStatus = 'Received';
                            message.messageTimeReceived = decryptedConfirmation.timeReceived;
                        }
                    });

                    database.updateDocument(decryptedConfirmation.sender, friend);
                    notificationService.refreshMessageStatus(decryptedConfirmation.sender);
                });

                // prevent triggering the event listener recursively, then clear the record on firebase
                firebase.removeEventListeners(eventListeners, myConfirmationsPath);
                firebase.setValue(myConfirmationsPath, null);

                // then resolve Promise
                resolve('All notifications collected');

            } else reject('Failed to retrieve all notifications');

        }, myConfirmationsPath)
            .then(listenerWrapper => {

                // get eventListeners ref
                eventListeners = listenerWrapper.listeners;
            });
    });
}


// Crypto and utility functions

function encrypt(payload: Object, key: string) {

    var encryptionKey = forge.pki.publicKeyFromPem(key);
    var preProcessedPayload = JSON.stringify(payload);
    preProcessedPayload = forge.util.encodeUtf8(preProcessedPayload);
    preProcessedPayload = forge.util.encode64(preProcessedPayload);
    var encryptedPayload = '';

    // handle messages longer than the 4B key    
    while (preProcessedPayload) {
        encryptedPayload += encryptionKey.encrypt(preProcessedPayload.slice(0, 501));       // because the key is 4 Kbits and padding is 11 Bytes
        preProcessedPayload = preProcessedPayload.substr(501, preProcessedPayload.length - 1);
    }

    return encryptedPayload;
}

function decrypt(payload: string) {

    var decryptionKey = forge.pki.privateKeyFromPem(appDocumentRef.settings.privateKey);
    var decryptedPayloadString = '';

    // handle messages longer than the 4B key
    while (payload) {
        decryptedPayloadString += decryptionKey.decrypt(payload.substr(0, 512));
        payload = payload.substr(512, payload.length);
    }

    decryptedPayloadString = forge.util.decode64(decryptedPayloadString);
    decryptedPayloadString = forge.util.decodeUtf8(decryptedPayloadString);

    return JSON.parse(decryptedPayloadString);
}

function getRandomishString() {
    return Math.random().toString(36).slice(2);
}