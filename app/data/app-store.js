"use strict";
var nativescript_couchbase_1 = require("nativescript-couchbase");
var firebase = require("nativescript-plugin-firebase");
var forge = require("node-forge");
var app_data_model_1 = require("./app-data-model");
var notificationService = require("./notification");
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
var DB_config = {
    db_name: 'couchbase.db',
};
var database = new nativescript_couchbase_1.Couchbase(DB_config.db_name);
// Pre-define Queries
database.createView('friends', '1', function (document, emitter) {
    if (document.documentType === 'Friend') {
        emitter.emit(document.timeLastMessage, document); // call back with this document;
    }
    ;
});
function resetDatabase() {
    database = database.destroyDatabase();
    database = new nativescript_couchbase_1.Couchbase(DB_config.db_name);
}
//////////////////////////////
// Utility functions exposed to all other Views, which abstract away completely from the DB backend. 
//////////////////////////////
// General App details data and Database initalisation
var appDocumentRef = database.getDocument('squeak-app');
function checkAppDataAlreadyInitialised() {
    if (appDocumentRef)
        return true;
    return false;
}
exports.checkAppDataAlreadyInitialised = checkAppDataAlreadyInitialised;
var AppData = (function () {
    function AppData() {
        this.firebaseInit = function () {
            return new Promise(function (resolve, reject) {
                firebase.init({
                    onMessageReceivedCallback: function (notification) {
                        if (notification.m) {
                            retrieveAllMessages().then(function (messagesArray) { return notificationService.alertNewMessages(messagesArray); });
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
                }).then(function () {
                    //
                }, function (error) {
                    alert(error);
                });
            });
        };
    }
    AppData.prototype.startAppData = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.firebaseInit().then(function (firebaseMessagingToken) {
                firebase.login({
                    type: firebase.LoginType.PASSWORD,
                    email: appDocumentRef.settings.randomIdentity.email,
                    password: appDocumentRef.settings.randomIdentity.password
                })
                    .then(function (user) {
                }, function (error) {
                    alert('Error: ' + error);
                });
                resolve('App Initialised!'); // do not wait for firebase - user should be able to see local data
            });
        });
    };
    AppData.prototype.generateRandomFirebaseUser = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            resetDatabase();
            _this.firebaseInit().then(function (firebaseMessagingToken) {
                var randomEmail = getRandomishString() + '@' + getRandomishString() + '.com';
                var randomPassword = forge.random.getBytesSync(32);
                firebase.createUser({
                    email: randomEmail,
                    password: randomPassword
                }).then(function (user) {
                    resolve({
                        firebaseUID: user.key,
                        email: randomEmail,
                        password: randomPassword,
                        firebaseMessagingToken: firebaseMessagingToken
                    });
                }, function (error) {
                    alert('Failed to register Anonymous identity on remote servers ' + error);
                });
            });
        });
    };
    AppData.prototype.saveRandomUserLocally = function (user) {
        return new Promise(function (resolve, reject) {
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
    };
    AppData.prototype.updateFirebaseRecords = function (user) {
        return new Promise(function (resolve, reject) {
            firebase.setValue('/u/' + user.userUID, {
                k: user.publicKey,
                t: user.firebaseMessagingToken,
                x: [],
                z: []
            }).then(function () {
                resolve('App Data initialised.');
            }, function (error) {
                alert('Failed to set User details on remote servers ' + error);
            });
        });
    };
    return AppData;
}());
exports.AppData = AppData;
// Local account related data
function fetchLocalAccountDetails() {
    return database.getDocument('squeak-app');
}
exports.fetchLocalAccountDetails = fetchLocalAccountDetails;
function updateLocalNickname(nickname) {
    var localSettingsDocument = database.getDocument('squeak-app');
    localSettingsDocument.settings.nickname = nickname;
    database.updateDocument('squeak-app', localSettingsDocument);
}
exports.updateLocalNickname = updateLocalNickname;
// Friends List related data
function getFriend(friendId) {
    return database.getDocument(friendId);
}
exports.getFriend = getFriend;
var getFriendPublicKey = function (firebaseId) {
    return new Promise(function (resolve, reject) {
        var friendPublicKeyPath = '/u/' + firebaseId + '/k/';
        firebase.addValueEventListener(function (snapshot) {
            resolve(snapshot.value);
        }, friendPublicKeyPath)
            .catch(function (error) {
            alert(error);
        });
    });
};
exports.getFriendsList = function () {
    return new Promise(function (resolve, reject) {
        var friendsListQuery = database.executeQuery('friends');
        if (friendsListQuery) {
            var sortedFriendsList = friendsListQuery.sort(function (a, b) {
                var dateA = new Date(a.timeLastMessage).valueOf();
                var dateB = new Date(b.timeLastMessage).valueOf();
                return dateB - dateA; // newest at the top
            });
            resolve(friendsListQuery);
        }
        else {
            reject('Could not obtain List of Friends from Database');
        }
    });
};
exports.addFriend = function (firebaseId) {
    return new Promise(function (resolve, reject) {
        var myProfile = database.getDocument('squeak-app').settings;
        var authorisedFriendPath = '/u/' + myProfile.firebaseUID + '/x/' + firebaseId;
        // add this user code / firebase Id to the list of people who can message me
        firebase.setValue(authorisedFriendPath, true).then(function () {
            // notify friend with our own details
            getFriendPublicKey(firebaseId).then(function (publicKey) {
                var myDetails = {
                    nickname: myProfile.nickname,
                    firebaseId: myProfile.firebaseUID
                };
                var encryptedMyDetails = encrypt(myDetails, publicKey);
                firebase.push('/n/' + firebaseId, encryptedMyDetails).then(function () {
                    var friendRef = database.getDocument(firebaseId);
                    // if friendRef does not exist, initialise temporary values
                    if (!friendRef) {
                        //   Set preliminary details details for friend
                        var newFriend = new app_data_model_1.Friend('Pending');
                        newFriend.lastMessagePreview = 'Waiting for friend confirmation... (code: ' + firebaseId + ')';
                        database.createDocument(newFriend, firebaseId);
                    }
                    resolve('Added New Friend');
                });
            });
        });
    });
};
var handleAddFriendNotifications = function () {
    return new Promise(function (resolve, reject) {
        var myId = appDocumentRef.settings.firebaseUID;
        var eventListeners;
        var myNotificationsPath = '/n/' + myId;
        firebase.addValueEventListener(function (snapshot) {
            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.
            if (snapshot.value) {
                var keysArray = Object.keys(snapshot.value);
                keysArray.forEach(function (key) {
                    var friend = decrypt(snapshot.value[key]);
                    var localFriendRef = database.getDocument(friend.firebaseId);
                    // if we already have a record for that friend (i.e. they gave us the code), update the Friend record
                    if (localFriendRef) {
                        localFriendRef.nickname = friend.nickname;
                        localFriendRef.lastMessagePreview = 'New Friend';
                        database.updateDocument(friend.firebaseId, localFriendRef);
                        notificationService.alertFriendConfirmation(friend.nickname);
                    }
                    else {
                        // if we do not have a record for that friend (i.e. we gave them the code), request permission to add them to our friends list
                        notificationService.alertFriendRequest(friend.nickname)
                            .then(function (confirmation) {
                            // if we receive a true value (== accept) from the Promise
                            if (confirmation) {
                                // add Friend record with initial values
                                exports.addFriend(friend.firebaseId).then(function () {
                                    // then update with the actual values
                                    var localFriendRef = database.getDocument(friend.firebaseId);
                                    localFriendRef.nickname = friend.nickname;
                                    localFriendRef.lastMessagePreview = 'New Friend';
                                    database.updateDocument(friend.firebaseId, localFriendRef);
                                    notificationService.alertFriendConfirmation(friend.nickname);
                                });
                            }
                        });
                    }
                    ;
                });
                firebase.removeEventListeners(eventListeners, myNotificationsPath);
                firebase.setValue(myNotificationsPath, null);
                resolve('All notifications retrieved');
            }
            else
                reject('Could not find any notification on Firebase');
        }, myNotificationsPath).then(function (listenerWrapper) {
            // get eventListeners ref
            eventListeners = listenerWrapper.listeners;
        });
    });
};
exports.removeFriend = function (targetId) {
    return new Promise(function (resolve, reject) {
        // get the path to the permission entry to remove
        var permissionPath = '/u/' + appDocumentRef.settings.firebaseUID + '/x/';
        firebase.query(function (result) {
            // only get excited if we actually find the permission record
            if (result.value) {
                var target = Object.keys(result.value)[0]; // == the key to the record to remove
                // set the target path to null
                firebase.setValue(permissionPath + target, null).then(function () {
                    // then delete the local record and resolve
                    database.deleteDocument(targetId);
                    resolve('Removed Friend');
                });
            }
            else {
                database.deleteDocument(targetId);
                resolve('Friend did not have permissions to message you'); // == the firebase record was previously deleted (should not happen)
            }
        }, permissionPath, {
            singleEvent: true,
            orderBy: {
                type: firebase.QueryOrderByType.VALUE,
            }
        });
    });
};
exports.updateFriend = function (targetId, newProperties) {
    return new Promise(function (resolve, reject) {
        database.updateDocument(targetId, newProperties);
        resolve('Edited Friend');
    });
};
// Messages related data
exports.sendMessage = function (chatId, messageText) {
    return new Promise(function (resolve, reject) {
        var newFriendDocument = database.getDocument(chatId);
        var newMessage = new app_data_model_1.Message(messageText, true);
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
        getFriendPublicKey(chatId).then(function (publicKey) {
            var encryptedMessage = encrypt(message, publicKey);
            // push message to firebase
            firebase.push('/u/' + newFriendDocument._id + '/z', encryptedMessage)
                .then(function (confirmation) {
                newFriendDocument.messages[newMessageIndex - 1].messageStatus = "Sent";
                newFriendDocument.messages[newMessageIndex - 1].id = confirmation.key;
                database.updateDocument(chatId, newFriendDocument);
                resolve('Message Sent');
            }, function (error) {
                newFriendDocument.messages[newMessageIndex - 1].messageStatus = "Failed";
                database.updateDocument(chatId, newFriendDocument);
                alert(error);
                reject();
            });
        }).catch(function (error) {
            alert(error);
        });
    });
};
function retrieveAllMessages() {
    return new Promise(function (resolve, reject) {
        var myId = appDocumentRef.settings.firebaseUID;
        var eventListeners;
        var myMessagesPath = '/u/' + myId + '/z';
        firebase.addValueEventListener(function (snapshot) {
            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.
            if (snapshot.value) {
                var messagesArray = [];
                var keysArray = Object.keys(snapshot.value);
                keysArray.forEach(function (key) {
                    var decryptedMessage = decrypt(snapshot.value[key]);
                    // create new Message() for local consumption
                    var newMessage = new app_data_model_1.Message('', false);
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
                    targetFriend.messages = targetFriend.messages.sort(function (a, b) {
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
            }
            else
                reject('Could not find any message on Firebase');
        }, myMessagesPath).then(function (listenerWrapper) {
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
    getFriendPublicKey(author).then(function (publicKey) {
        var encryptedPayload = encrypt(payload, publicKey);
        firebase.push(notificationPath, encryptedPayload);
    });
}
function handleMessageReceiptNotification() {
    return new Promise(function (resolve, reject) {
        var myId = appDocumentRef.settings.firebaseUID;
        var eventListeners;
        var myConfirmationsPath = '/c/' + myId;
        firebase.addValueEventListener(function (snapshot) {
            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.
            if (snapshot.value) {
                var keysArray = Object.keys(snapshot.value);
                keysArray.forEach(function (key) {
                    // for each confirmation logged on firebase, decrypt                    
                    var decryptedConfirmation = decrypt(snapshot.value[key]);
                    var friend = database.getDocument(decryptedConfirmation.sender);
                    // then find the message it relates to and change its status and time received properties                    
                    friend.messages.forEach(function (message) {
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
            }
            else
                reject('Failed to retrieve all notifications');
        }, myConfirmationsPath)
            .then(function (listenerWrapper) {
            // get eventListeners ref
            eventListeners = listenerWrapper.listeners;
        });
    });
}
// Crypto and utility functions
function encrypt(payload, key) {
    var encryptionKey = forge.pki.publicKeyFromPem(key);
    var preProcessedPayload = JSON.stringify(payload);
    var encryptedPayload = '';
    // handle messages longer than the 4B key    
    while (preProcessedPayload) {
        encryptedPayload += encryptionKey.encrypt(preProcessedPayload.slice(0, 501)); // because the key is 4 Kbits and padding is 11 Bytes
        preProcessedPayload = preProcessedPayload.substr(501, preProcessedPayload.length - 1);
    }
    return encryptedPayload;
}
function decrypt(payload) {
    var decryptionKey = forge.pki.privateKeyFromPem(appDocumentRef.settings.privateKey);
    var decryptedPayloadString = '';
    // handle messages longer than the 4B key
    while (payload) {
        decryptedPayloadString += decryptionKey.decrypt(payload.substr(0, 512));
        payload = payload.substr(512, payload.length);
    }
    return JSON.parse(decryptedPayloadString);
}
function getRandomishString() {
    return Math.random().toString(36).slice(2);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpRUFBbUQ7QUFDbkQsdURBQXlEO0FBQ3pELGtDQUFvQztBQUVwQyxtREFBbUQ7QUFDbkQsb0RBQXNEO0FBRXRELHVCQUF1QjtBQUN2QixPQUFPO0FBQ1AsR0FBRztBQUNILDZJQUE2STtBQUM3SSwySEFBMkg7QUFDM0gsa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxrSUFBa0k7QUFDbEksR0FBRztBQUNILHVCQUF1QjtBQUd2QixrQ0FBa0M7QUFDbEMsSUFBTSxTQUFTLEdBQUc7SUFDZCxPQUFPLEVBQUUsY0FBYztDQUMxQixDQUFBO0FBQ0QsSUFBSSxRQUFRLEdBQUcsSUFBSSxrQ0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUVoRCxxQkFBcUI7QUFDckIsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLFVBQUMsUUFBUSxFQUFFLE9BQU87SUFDbEQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFLLGdDQUFnQztJQUMxRixDQUFDO0lBQUEsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBRUg7SUFDSSxRQUFRLEdBQUcsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3RDLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2hELENBQUM7QUFFRCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVB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QUM7SUFFaEMseUNBQXlDO0lBQ3pDLE9BQU8sT0FBTyxFQUFFLENBQUM7UUFDYixzQkFBc0IsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvdWNoYmFzZSB9IGZyb20gJ25hdGl2ZXNjcmlwdC1jb3VjaGJhc2UnO1xuaW1wb3J0ICogYXMgZmlyZWJhc2UgZnJvbSAnbmF0aXZlc2NyaXB0LXBsdWdpbi1maXJlYmFzZSc7XG5pbXBvcnQgKiBhcyBmb3JnZSBmcm9tICdub2RlLWZvcmdlJztcblxuaW1wb3J0IHsgRnJpZW5kLCBNZXNzYWdlIH0gZnJvbSAnLi9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgKiBhcyBub3RpZmljYXRpb25TZXJ2aWNlIGZyb20gJy4vbm90aWZpY2F0aW9uJztcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEFQSTpcbi8vIFxuLy8gaW5pdEZyaWVuZHNEYXRhKCkudGhlbig8ZG8gc3R1ZmY+KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGluaXRhbGlzZXMgdGhlIERhdGFiYXNlIGFuZCB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBnZXRGcmllbmRzTGlzdCgpLnRoZW4oIGZyaWVuZHNMaXN0ID0+IHsgPGRvIHN0dWZmIHdpdGggZnJpZW5kc0xpc3QgQXJyYXk+IH0gKSAgICAgICAgLS0gZ2V0cyB0aGUgZnJpZW5kc0xpc3QgYXMgYW4gQXJyYXlcbi8vIGFkZEZyaWVuZCg8ZnJpZW5kIG5pY2tuYW1lPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHJlbW92ZUZyaWVuZCg8ZnJpZW5kIF9pZD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHVwZGF0ZUZyaWVuZCg8ZnJpZW5kIF9pZD4sIDxuZXcgZGF0YSBjb250ZW50PikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBDb3VjaGJhc2UgaW5pdGlhbCBjb25maWd1cmF0aW9uXG5jb25zdCBEQl9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ2NvdWNoYmFzZS5kYicsXG59XG52YXIgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcblxuLy8gUHJlLWRlZmluZSBRdWVyaWVzXG5kYXRhYmFzZS5jcmVhdGVWaWV3KCdmcmllbmRzJywgJzEnLCAoZG9jdW1lbnQsIGVtaXR0ZXIpID0+IHtcbiAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRUeXBlID09PSAnRnJpZW5kJykge1xuICAgICAgICBlbWl0dGVyLmVtaXQoZG9jdW1lbnQudGltZUxhc3RNZXNzYWdlLCBkb2N1bWVudCk7ICAgICAvLyBjYWxsIGJhY2sgd2l0aCB0aGlzIGRvY3VtZW50O1xuICAgIH07XG59KTtcblxuZnVuY3Rpb24gcmVzZXREYXRhYmFzZSgpIHtcbiAgICBkYXRhYmFzZSA9IGRhdGFiYXNlLmRlc3Ryb3lEYXRhYmFzZSgpO1xuICAgIGRhdGFiYXNlID0gbmV3IENvdWNoYmFzZShEQl9jb25maWcuZGJfbmFtZSk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gVXRpbGl0eSBmdW5jdGlvbnMgZXhwb3NlZCB0byBhbGwgb3RoZXIgVmlld3MsIHdoaWNoIGFic3RyYWN0IGF3YXkgY29tcGxldGVseSBmcm9tIHRoZSBEQiBiYWNrZW5kLiBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIEdlbmVyYWwgQXBwIGRldGFpbHMgZGF0YSBhbmQgRGF0YWJhc2UgaW5pdGFsaXNhdGlvblxuXG52YXIgYXBwRG9jdW1lbnRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBcHBEYXRhQWxyZWFkeUluaXRpYWxpc2VkKCk6IEJvb2xlYW4ge1xuICAgIGlmIChhcHBEb2N1bWVudFJlZikgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwRGF0YSB7XG5cbiAgICBwcml2YXRlIGZpcmViYXNlSW5pdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgdG9rZW46IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBmaXJlYmFzZS5pbml0KHtcblxuICAgICAgICAgICAgICAgIG9uTWVzc2FnZVJlY2VpdmVkQ2FsbGJhY2s6IGZ1bmN0aW9uIChub3RpZmljYXRpb246IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm90aWZpY2F0aW9uLm0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHJpZXZlQWxsTWVzc2FnZXMoKS50aGVuKG1lc3NhZ2VzQXJyYXkgPT4gbm90aWZpY2F0aW9uU2VydmljZS5hbGVydE5ld01lc3NhZ2VzKG1lc3NhZ2VzQXJyYXkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlQWRkRnJpZW5kTm90aWZpY2F0aW9ucygpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGlmaWNhdGlvbi5jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVNZXNzYWdlUmVjZWlwdE5vdGlmaWNhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIG9uUHVzaFRva2VuUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGFydEFwcERhdGEoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuZmlyZWJhc2VJbml0KCkudGhlbihmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuID0+IHtcblxuICAgICAgICAgICAgICAgIGZpcmViYXNlLmxvZ2luKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlyZWJhc2UuTG9naW5UeXBlLlBBU1NXT1JELFxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5wYXNzd29yZFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHVzZXIgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvcjogJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIEluaXRpYWxpc2VkIScpOyAgICAgICAgICAgLy8gZG8gbm90IHdhaXQgZm9yIGZpcmViYXNlIC0gdXNlciBzaG91bGQgYmUgYWJsZSB0byBzZWUgbG9jYWwgZGF0YVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdlbmVyYXRlUmFuZG9tRmlyZWJhc2VVc2VyKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICByZXNldERhdGFiYXNlKCk7XG5cbiAgICAgICAgICAgIHRoaXMuZmlyZWJhc2VJbml0KCkudGhlbihmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZG9tRW1haWwgPSBnZXRSYW5kb21pc2hTdHJpbmcoKSArICdAJyArIGdldFJhbmRvbWlzaFN0cmluZygpICsgJy5jb20nO1xuICAgICAgICAgICAgICAgIHZhciByYW5kb21QYXNzd29yZCA9IGZvcmdlLnJhbmRvbS5nZXRCeXRlc1N5bmMoMzIpO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UuY3JlYXRlVXNlcih7XG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkXG4gICAgICAgICAgICAgICAgfSkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZVVJRDogdXNlci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogcmFuZG9tRW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogcmFuZG9tUGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuOiBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byByZWdpc3RlciBBbm9ueW1vdXMgaWRlbnRpdHkgb24gcmVtb3RlIHNlcnZlcnMgJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2F2ZVJhbmRvbVVzZXJMb2NhbGx5KHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUga2V5IHBhaXIgICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBrZXlwYWlyID0gZm9yZ2UucGtpLnJzYS5nZW5lcmF0ZUtleVBhaXIoeyBiaXRzOiA0MDk2LCBlOiAweDEwMDAxIH0pO1xuICAgICAgICAgICAgdmFyIHByaXZhdGVLZXkgPSBmb3JnZS5wa2kucHJpdmF0ZUtleVRvUGVtKGtleXBhaXIucHJpdmF0ZUtleSk7XG4gICAgICAgICAgICB2YXIgcHVibGljS2V5ID0gZm9yZ2UucGtpLnB1YmxpY0tleVRvUGVtKGtleXBhaXIucHVibGljS2V5KTtcblxuICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQoe1xuICAgICAgICAgICAgICAgIGFwcE5hbWU6ICdTcXVlYWsnLFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgIGF2YXRhclBhdGg6ICd+L2ltYWdlcy9hdmF0YXIucG5nJyxcbiAgICAgICAgICAgICAgICAgICAgbmlja25hbWU6ICdTcXVlYWsnLFxuICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZVVJRDogdXNlci5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICAgICAgZmNtTWVzc2FnaW5nVG9rZW46IHVzZXIuZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgcmFuZG9tSWRlbnRpdHk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHVzZXIucGFzc3dvcmRcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZUtleTogcHJpdmF0ZUtleSxcbiAgICAgICAgICAgICAgICAgICAgcHVibGljS2V5OiBwdWJsaWNLZXlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAnc3F1ZWFrLWFwcCcpO1xuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgdXNlclVJRDogdXNlci5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuOiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW4sXG4gICAgICAgICAgICAgICAgcHVibGljS2V5OiBwdWJsaWNLZXlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlRmlyZWJhc2VSZWNvcmRzKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZpcmViYXNlLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICcvdS8nICsgdXNlci51c2VyVUlELFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgazogdXNlci5wdWJsaWNLZXksXG4gICAgICAgICAgICAgICAgICAgIHQ6IHVzZXIuZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgeDogW10sXG4gICAgICAgICAgICAgICAgICAgIHo6IFtdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdBcHAgRGF0YSBpbml0aWFsaXNlZC4nKTtcbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydCgnRmFpbGVkIHRvIHNldCBVc2VyIGRldGFpbHMgb24gcmVtb3RlIHNlcnZlcnMgJyArIGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cblxuLy8gTG9jYWwgYWNjb3VudCByZWxhdGVkIGRhdGFcblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoTG9jYWxBY2NvdW50RGV0YWlscygpIHtcbiAgICByZXR1cm4gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUxvY2FsTmlja25hbWUobmlja25hbWUpIHtcbiAgICB2YXIgbG9jYWxTZXR0aW5nc0RvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcbiAgICBsb2NhbFNldHRpbmdzRG9jdW1lbnQuc2V0dGluZ3Mubmlja25hbWUgPSBuaWNrbmFtZTtcbiAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCgnc3F1ZWFrLWFwcCcsIGxvY2FsU2V0dGluZ3NEb2N1bWVudCk7XG59XG5cblxuLy8gRnJpZW5kcyBMaXN0IHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RnJpZW5kKGZyaWVuZElkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kSWQpO1xufVxuXG52YXIgZ2V0RnJpZW5kUHVibGljS2V5ID0gZnVuY3Rpb24gKGZpcmViYXNlSWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIGZyaWVuZFB1YmxpY0tleVBhdGggPSAnL3UvJyArIGZpcmViYXNlSWQgKyAnL2svJztcbiAgICAgICAgZmlyZWJhc2UuYWRkVmFsdWVFdmVudExpc3RlbmVyKHNuYXBzaG90ID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoc25hcHNob3QudmFsdWUpO1xuICAgICAgICB9LCBmcmllbmRQdWJsaWNLZXlQYXRoKVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIGZyaWVuZHNMaXN0UXVlcnkgPSBkYXRhYmFzZS5leGVjdXRlUXVlcnkoJ2ZyaWVuZHMnKTtcbiAgICAgICAgaWYgKGZyaWVuZHNMaXN0UXVlcnkpIHtcblxuICAgICAgICAgICAgdmFyIHNvcnRlZEZyaWVuZHNMaXN0ID0gZnJpZW5kc0xpc3RRdWVyeS5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGVBID0gbmV3IERhdGUoYS50aW1lTGFzdE1lc3NhZ2UpLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZUIgPSBuZXcgRGF0ZShiLnRpbWVMYXN0TWVzc2FnZSkudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlQiAtIGRhdGVBOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXdlc3QgYXQgdGhlIHRvcFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlc29sdmUoZnJpZW5kc0xpc3RRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoJ0NvdWxkIG5vdCBvYnRhaW4gTGlzdCBvZiBGcmllbmRzIGZyb20gRGF0YWJhc2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChmaXJlYmFzZUlkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBteVByb2ZpbGUgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpLnNldHRpbmdzO1xuICAgICAgICB2YXIgYXV0aG9yaXNlZEZyaWVuZFBhdGggPSAnL3UvJyArIG15UHJvZmlsZS5maXJlYmFzZVVJRCArICcveC8nICsgZmlyZWJhc2VJZDtcblxuICAgICAgICAvLyBhZGQgdGhpcyB1c2VyIGNvZGUgLyBmaXJlYmFzZSBJZCB0byB0aGUgbGlzdCBvZiBwZW9wbGUgd2hvIGNhbiBtZXNzYWdlIG1lXG4gICAgICAgIGZpcmViYXNlLnNldFZhbHVlKFxuICAgICAgICAgICAgYXV0aG9yaXNlZEZyaWVuZFBhdGgsXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgICkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIG5vdGlmeSBmcmllbmQgd2l0aCBvdXIgb3duIGRldGFpbHNcbiAgICAgICAgICAgIGdldEZyaWVuZFB1YmxpY0tleShmaXJlYmFzZUlkKS50aGVuKHB1YmxpY0tleSA9PiB7XG5cbiAgICAgICAgICAgICAgICB2YXIgbXlEZXRhaWxzID0ge1xuICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogbXlQcm9maWxlLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZUlkOiBteVByb2ZpbGUuZmlyZWJhc2VVSURcbiAgICAgICAgICAgICAgICAgICAgLy8gYXZhdGFyOlxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIGVuY3J5cHRlZE15RGV0YWlscyA9IGVuY3J5cHQobXlEZXRhaWxzLCBwdWJsaWNLZXkpO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICAgICAgICAgJy9uLycgKyBmaXJlYmFzZUlkLFxuICAgICAgICAgICAgICAgICAgICBlbmNyeXB0ZWRNeURldGFpbHNcbiAgICAgICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmaXJlYmFzZUlkKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBmcmllbmRSZWYgZG9lcyBub3QgZXhpc3QsIGluaXRpYWxpc2UgdGVtcG9yYXJ5IHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWZyaWVuZFJlZikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgIFNldCBwcmVsaW1pbmFyeSBkZXRhaWxzIGRldGFpbHMgZm9yIGZyaWVuZFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0ZyaWVuZCA9IG5ldyBGcmllbmQoJ1BlbmRpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZC5sYXN0TWVzc2FnZVByZXZpZXcgPSAnV2FpdGluZyBmb3IgZnJpZW5kIGNvbmZpcm1hdGlvbi4uLiAoY29kZTogJyArIGZpcmViYXNlSWQgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudChuZXdGcmllbmQsIGZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FkZGVkIE5ldyBGcmllbmQnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxudmFyIGhhbmRsZUFkZEZyaWVuZE5vdGlmaWNhdGlvbnMgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgbXlJZCA9IGFwcERvY3VtZW50UmVmLnNldHRpbmdzLmZpcmViYXNlVUlEO1xuICAgICAgICB2YXIgZXZlbnRMaXN0ZW5lcnM7XG4gICAgICAgIHZhciBteU5vdGlmaWNhdGlvbnNQYXRoID0gJy9uLycgKyBteUlkO1xuXG4gICAgICAgIGZpcmViYXNlLmFkZFZhbHVlRXZlbnRMaXN0ZW5lcihzbmFwc2hvdCA9PiB7XG5cbiAgICAgICAgICAgIC8vIG9ubHkgZ2V0IGV4Y2l0ZWQgd2hlbiB0aGluZ3MgYXJlIEFkZGVkIHRvIHRoZSBQYXRoLCBub3QgYWxzbyBvbiB0aGUgUmVtb3ZlIGV2ZW50IHdoaWNoIGlzIHRyaWdnZXJlZCBsYXRlci5cbiAgICAgICAgICAgIGlmIChzbmFwc2hvdC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBrZXlzQXJyYXkgPSBPYmplY3Qua2V5cyhzbmFwc2hvdC52YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICBrZXlzQXJyYXkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZnJpZW5kID0gZGVjcnlwdChzbmFwc2hvdC52YWx1ZVtrZXldKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxvY2FsRnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdlIGFscmVhZHkgaGF2ZSBhIHJlY29yZCBmb3IgdGhhdCBmcmllbmQgKGkuZS4gdGhleSBnYXZlIHVzIHRoZSBjb2RlKSwgdXBkYXRlIHRoZSBGcmllbmQgcmVjb3JkXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2NhbEZyaWVuZFJlZikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbEZyaWVuZFJlZi5uaWNrbmFtZSA9IGZyaWVuZC5uaWNrbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsRnJpZW5kUmVmLmxhc3RNZXNzYWdlUHJldmlldyA9ICdOZXcgRnJpZW5kJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGZyaWVuZC5maXJlYmFzZUlkLCBsb2NhbEZyaWVuZFJlZik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblNlcnZpY2UuYWxlcnRGcmllbmRDb25maXJtYXRpb24oZnJpZW5kLm5pY2tuYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgZG8gbm90IGhhdmUgYSByZWNvcmQgZm9yIHRoYXQgZnJpZW5kIChpLmUuIHdlIGdhdmUgdGhlbSB0aGUgY29kZSksIHJlcXVlc3QgcGVybWlzc2lvbiB0byBhZGQgdGhlbSB0byBvdXIgZnJpZW5kcyBsaXN0XG4gICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kUmVxdWVzdChmcmllbmQubmlja25hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oY29uZmlybWF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgcmVjZWl2ZSBhIHRydWUgdmFsdWUgKD09IGFjY2VwdCkgZnJvbSB0aGUgUHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybWF0aW9uKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZCBGcmllbmQgcmVjb3JkIHdpdGggaW5pdGlhbCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEZyaWVuZChmcmllbmQuZmlyZWJhc2VJZCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVuIHVwZGF0ZSB3aXRoIHRoZSBhY3R1YWwgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvY2FsRnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsRnJpZW5kUmVmLm5pY2tuYW1lID0gZnJpZW5kLm5pY2tuYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsRnJpZW5kUmVmLmxhc3RNZXNzYWdlUHJldmlldyA9ICdOZXcgRnJpZW5kJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCwgbG9jYWxGcmllbmRSZWYpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZENvbmZpcm1hdGlvbihmcmllbmQubmlja25hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGZpcmViYXNlLnJlbW92ZUV2ZW50TGlzdGVuZXJzKGV2ZW50TGlzdGVuZXJzLCBteU5vdGlmaWNhdGlvbnNQYXRoKTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShteU5vdGlmaWNhdGlvbnNQYXRoLCBudWxsKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdBbGwgbm90aWZpY2F0aW9ucyByZXRyaWV2ZWQnKTtcblxuICAgICAgICAgICAgfSBlbHNlIHJlamVjdCgnQ291bGQgbm90IGZpbmQgYW55IG5vdGlmaWNhdGlvbiBvbiBGaXJlYmFzZScpO1xuXG4gICAgICAgIH0sIG15Tm90aWZpY2F0aW9uc1BhdGgpLnRoZW4obGlzdGVuZXJXcmFwcGVyID0+IHtcblxuICAgICAgICAgICAgLy8gZ2V0IGV2ZW50TGlzdGVuZXJzIHJlZlxuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lcnMgPSBsaXN0ZW5lcldyYXBwZXIubGlzdGVuZXJzO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciByZW1vdmVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBwYXRoIHRvIHRoZSBwZXJtaXNzaW9uIGVudHJ5IHRvIHJlbW92ZVxuICAgICAgICB2YXIgcGVybWlzc2lvblBhdGggPSAnL3UvJyArIGFwcERvY3VtZW50UmVmLnNldHRpbmdzLmZpcmViYXNlVUlEICsgJy94LydcbiAgICAgICAgZmlyZWJhc2UucXVlcnkocmVzdWx0ID0+IHtcblxuICAgICAgICAgICAgLy8gb25seSBnZXQgZXhjaXRlZCBpZiB3ZSBhY3R1YWxseSBmaW5kIHRoZSBwZXJtaXNzaW9uIHJlY29yZFxuICAgICAgICAgICAgaWYgKHJlc3VsdC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBPYmplY3Qua2V5cyhyZXN1bHQudmFsdWUpWzBdOyAgLy8gPT0gdGhlIGtleSB0byB0aGUgcmVjb3JkIHRvIHJlbW92ZVxuXG4gICAgICAgICAgICAgICAgLy8gc2V0IHRoZSB0YXJnZXQgcGF0aCB0byBudWxsXG4gICAgICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUocGVybWlzc2lvblBhdGggKyB0YXJnZXQsIG51bGwpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gZGVsZXRlIHRoZSBsb2NhbCByZWNvcmQgYW5kIHJlc29sdmVcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuZGVsZXRlRG9jdW1lbnQodGFyZ2V0SWQpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCdSZW1vdmVkIEZyaWVuZCcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnRnJpZW5kIGRpZCBub3QgaGF2ZSBwZXJtaXNzaW9ucyB0byBtZXNzYWdlIHlvdScpOyAgICAgIC8vID09IHRoZSBmaXJlYmFzZSByZWNvcmQgd2FzIHByZXZpb3VzbHkgZGVsZXRlZCAoc2hvdWxkIG5vdCBoYXBwZW4pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgICAgICBwZXJtaXNzaW9uUGF0aCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzaW5nbGVFdmVudDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBvcmRlckJ5OiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpcmViYXNlLlF1ZXJ5T3JkZXJCeVR5cGUuVkFMVUUsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgdXBkYXRlRnJpZW5kID0gZnVuY3Rpb24gKHRhcmdldElkOiBzdHJpbmcsIG5ld1Byb3BlcnRpZXM6IE9iamVjdCk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQodGFyZ2V0SWQsIG5ld1Byb3BlcnRpZXMpO1xuXG4gICAgICAgIHJlc29sdmUoJ0VkaXRlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuXG4vLyBNZXNzYWdlcyByZWxhdGVkIGRhdGFcblxuZXhwb3J0IHZhciBzZW5kTWVzc2FnZSA9IGZ1bmN0aW9uIChjaGF0SWQ6IHN0cmluZywgbWVzc2FnZVRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHZhciBuZXdGcmllbmREb2N1bWVudCA9IGRhdGFiYXNlLmdldERvY3VtZW50KGNoYXRJZCk7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlID0gbmV3IE1lc3NhZ2UobWVzc2FnZVRleHQsIHRydWUpO1xuXG4gICAgICAgIC8vIHN0b3JlIHRoZSBtZXNzYWdlIGluIG1lbW9yeSAgXG4gICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZUF1dGhvciA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJykuc2V0dGluZ3MuZmlyZWJhc2VVSUQ7XG4gICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRpbWVTZW50ID0gbmV3IERhdGUoKTtcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlU3RhdHVzID0gJ1NlbmRpbmcuLi4nO1xuICAgICAgICB2YXIgbmV3TWVzc2FnZUluZGV4ID0gbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXMucHVzaChuZXdNZXNzYWdlKTtcbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG5cbiAgICAgICAgLy8gcHJlcGFyZSBtZXNzYWdlIGZvciBzZW5kaW5nXG4gICAgICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgICAgICAgbWVzc2FnZUF1dGhvcjogbmV3TWVzc2FnZS5tZXNzYWdlQXV0aG9yLFxuICAgICAgICAgICAgbWVzc2FnZVRleHQ6IG5ld01lc3NhZ2UubWVzc2FnZVRleHQsXG4gICAgICAgICAgICBtZXNzYWdlVGltZVNlbnQ6IG5ld01lc3NhZ2UubWVzc2FnZVRpbWVTZW50XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZ2V0IGVuY3J5cHRpb24ga2V5XG4gICAgICAgIGdldEZyaWVuZFB1YmxpY0tleShjaGF0SWQpLnRoZW4ocHVibGljS2V5ID0+IHtcblxuICAgICAgICAgICAgdmFyIGVuY3J5cHRlZE1lc3NhZ2UgPSBlbmNyeXB0KG1lc3NhZ2UsIHB1YmxpY0tleSk7XG5cbiAgICAgICAgICAgIC8vIHB1c2ggbWVzc2FnZSB0byBmaXJlYmFzZVxuICAgICAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICAgICAnL3UvJyArIG5ld0ZyaWVuZERvY3VtZW50Ll9pZCArICcveicsXG4gICAgICAgICAgICAgICAgZW5jcnlwdGVkTWVzc2FnZVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC8vdGhlbiB1cGRhdGUgdGhlIGxvY2FsIHN0YXRlICAgIFxuICAgICAgICAgICAgICAgIC50aGVuKGNvbmZpcm1hdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIlNlbnRcIjtcbiAgICAgICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0uaWQgPSBjb25maXJtYXRpb24ua2V5O1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgnTWVzc2FnZSBTZW50Jyk7XG5cbiAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmV0cmlldmVBbGxNZXNzYWdlcygpOiBQcm9taXNlPEFycmF5PE9iamVjdD4+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBteUlkID0gYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MuZmlyZWJhc2VVSUQ7XG4gICAgICAgIHZhciBldmVudExpc3RlbmVycztcbiAgICAgICAgdmFyIG15TWVzc2FnZXNQYXRoID0gJy91LycgKyBteUlkICsgJy96JztcblxuICAgICAgICBmaXJlYmFzZS5hZGRWYWx1ZUV2ZW50TGlzdGVuZXIoc25hcHNob3QgPT4ge1xuXG4gICAgICAgICAgICAvLyBvbmx5IGdldCBleGNpdGVkIHdoZW4gdGhpbmdzIGFyZSBBZGRlZCB0byB0aGUgUGF0aCwgbm90IGFsc28gb24gdGhlIFJlbW92ZSBldmVudCB3aGljaCBpcyB0cmlnZ2VyZWQgbGF0ZXIuXG4gICAgICAgICAgICBpZiAoc25hcHNob3QudmFsdWUpIHtcblxuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlc0FycmF5ID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGtleXNBcnJheSA9IE9iamVjdC5rZXlzKHNuYXBzaG90LnZhbHVlKTtcbiAgICAgICAgICAgICAgICBrZXlzQXJyYXkuZm9yRWFjaChrZXkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWNyeXB0ZWRNZXNzYWdlID0gZGVjcnlwdChzbmFwc2hvdC52YWx1ZVtrZXldKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgbmV3IE1lc3NhZ2UoKSBmb3IgbG9jYWwgY29uc3VtcHRpb25cbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZSgnJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLmlkID0ga2V5O1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VBdXRob3IgPSBkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VBdXRob3I7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRleHQgPSBkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRpbWVTZW50KTtcbiAgICAgICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlU3RhdHVzID0gJ1JlY2VpdmVkJztcblxuICAgICAgICAgICAgICAgICAgICAvLyBzYXZlIHRoaXMgbWVzc2FnZSB0byByZXR1cm4gdG8gdGhlIG5vdGlmaWNhdGlvbiBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VzQXJyYXkucHVzaChuZXdNZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgdXBkYXRlZCBGcmllbmQgUmVjb3JkXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRGcmllbmQgPSBnZXRGcmllbmQoZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlQXV0aG9yKTtcblxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQubWVzc2FnZXMucHVzaChuZXdNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnRpbWVMYXN0TWVzc2FnZSA9IG5ld01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLmxhc3RNZXNzYWdlUHJldmlldyA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC51bnJlYWRNZXNzYWdlc051bWJlciArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZW4gc29ydCB0aGUgbWVzc2FnZXMuIGZvciBzb3J0aW5nIGFycmF5cywgc2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9zb3J0XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC5tZXNzYWdlcyA9IHRhcmdldEZyaWVuZC5tZXNzYWdlcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0ZUEgPSBuZXcgRGF0ZShhLm1lc3NhZ2VUaW1lU2VudCkudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGVCID0gbmV3IERhdGUoYi5tZXNzYWdlVGltZVNlbnQpLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlQSAtIGRhdGVCO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGRhdGFiYXNlXG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZUF1dGhvciwgdGFyZ2V0RnJpZW5kKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBub3RpZnkgc2VuZGVyIG9mIHJlY2VpcHRcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybU1lc3NhZ2VSZWNlaXB0KG15SWQsIGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZUF1dGhvciwgbmV3TWVzc2FnZS5pZCwgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGZpcmViYXNlLnJlbW92ZUV2ZW50TGlzdGVuZXJzKGV2ZW50TGlzdGVuZXJzLCBteU1lc3NhZ2VzUGF0aCk7XG4gICAgICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUobXlNZXNzYWdlc1BhdGgsIG51bGwpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobWVzc2FnZXNBcnJheSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSByZWplY3QoJ0NvdWxkIG5vdCBmaW5kIGFueSBtZXNzYWdlIG9uIEZpcmViYXNlJyk7XG5cbiAgICAgICAgfSwgbXlNZXNzYWdlc1BhdGgpLnRoZW4obGlzdGVuZXJXcmFwcGVyID0+IHtcblxuICAgICAgICAgICAgLy8gZ2V0IGV2ZW50TGlzdGVuZXJzIHJlZlxuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lcnMgPSBsaXN0ZW5lcldyYXBwZXIubGlzdGVuZXJzO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29uZmlybU1lc3NhZ2VSZWNlaXB0KG15SWQsIGF1dGhvciwgbWVzc2FnZUlkLCB0aW1lUmVjZWl2ZWQpIHtcbiAgICB2YXIgbm90aWZpY2F0aW9uUGF0aCA9ICcvYy8nICsgYXV0aG9yO1xuICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICBpZDogbWVzc2FnZUlkLFxuICAgICAgICBzZW5kZXI6IG15SWQsXG4gICAgICAgIHRpbWVSZWNlaXZlZDogdGltZVJlY2VpdmVkXG4gICAgfTtcblxuICAgIGdldEZyaWVuZFB1YmxpY0tleShhdXRob3IpLnRoZW4ocHVibGljS2V5ID0+IHtcbiAgICAgICAgdmFyIGVuY3J5cHRlZFBheWxvYWQgPSBlbmNyeXB0KHBheWxvYWQsIHB1YmxpY0tleSk7XG4gICAgICAgIGZpcmViYXNlLnB1c2gobm90aWZpY2F0aW9uUGF0aCwgZW5jcnlwdGVkUGF5bG9hZCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2VSZWNlaXB0Tm90aWZpY2F0aW9uKCk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG15SWQgPSBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5maXJlYmFzZVVJRDtcbiAgICAgICAgdmFyIGV2ZW50TGlzdGVuZXJzO1xuICAgICAgICB2YXIgbXlDb25maXJtYXRpb25zUGF0aCA9ICcvYy8nICsgbXlJZDtcblxuICAgICAgICBmaXJlYmFzZS5hZGRWYWx1ZUV2ZW50TGlzdGVuZXIoc25hcHNob3QgPT4ge1xuXG4gICAgICAgICAgICAvLyBvbmx5IGdldCBleGNpdGVkIHdoZW4gdGhpbmdzIGFyZSBBZGRlZCB0byB0aGUgUGF0aCwgbm90IGFsc28gb24gdGhlIFJlbW92ZSBldmVudCB3aGljaCBpcyB0cmlnZ2VyZWQgbGF0ZXIuXG4gICAgICAgICAgICBpZiAoc25hcHNob3QudmFsdWUpIHtcblxuICAgICAgICAgICAgICAgIHZhciBrZXlzQXJyYXkgPSBPYmplY3Qua2V5cyhzbmFwc2hvdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAga2V5c0FycmF5LmZvckVhY2goa2V5ID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBjb25maXJtYXRpb24gbG9nZ2VkIG9uIGZpcmViYXNlLCBkZWNyeXB0ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlY3J5cHRlZENvbmZpcm1hdGlvbiA9IGRlY3J5cHQoc25hcHNob3QudmFsdWVba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmcmllbmQgPSBkYXRhYmFzZS5nZXREb2N1bWVudChkZWNyeXB0ZWRDb25maXJtYXRpb24uc2VuZGVyKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB0aGVuIGZpbmQgdGhlIG1lc3NhZ2UgaXQgcmVsYXRlcyB0byBhbmQgY2hhbmdlIGl0cyBzdGF0dXMgYW5kIHRpbWUgcmVjZWl2ZWQgcHJvcGVydGllcyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZyaWVuZC5tZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlY3J5cHRlZENvbmZpcm1hdGlvbi5pZCA9PT0gbWVzc2FnZS5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UubWVzc2FnZVN0YXR1cyA9ICdSZWNlaXZlZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkID0gZGVjcnlwdGVkQ29uZmlybWF0aW9uLnRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoZGVjcnlwdGVkQ29uZmlybWF0aW9uLnNlbmRlciwgZnJpZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5yZWZyZXNoTWVzc2FnZVN0YXR1cyhkZWNyeXB0ZWRDb25maXJtYXRpb24uc2VuZGVyKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgdHJpZ2dlcmluZyB0aGUgZXZlbnQgbGlzdGVuZXIgcmVjdXJzaXZlbHksIHRoZW4gY2xlYXIgdGhlIHJlY29yZCBvbiBmaXJlYmFzZVxuICAgICAgICAgICAgICAgIGZpcmViYXNlLnJlbW92ZUV2ZW50TGlzdGVuZXJzKGV2ZW50TGlzdGVuZXJzLCBteUNvbmZpcm1hdGlvbnNQYXRoKTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShteUNvbmZpcm1hdGlvbnNQYXRoLCBudWxsKTtcblxuICAgICAgICAgICAgICAgIC8vIHRoZW4gcmVzb2x2ZSBQcm9taXNlXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQWxsIG5vdGlmaWNhdGlvbnMgY29sbGVjdGVkJyk7XG5cbiAgICAgICAgICAgIH0gZWxzZSByZWplY3QoJ0ZhaWxlZCB0byByZXRyaWV2ZSBhbGwgbm90aWZpY2F0aW9ucycpO1xuXG4gICAgICAgIH0sIG15Q29uZmlybWF0aW9uc1BhdGgpXG4gICAgICAgICAgICAudGhlbihsaXN0ZW5lcldyYXBwZXIgPT4ge1xuXG4gICAgICAgICAgICAgICAgLy8gZ2V0IGV2ZW50TGlzdGVuZXJzIHJlZlxuICAgICAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzID0gbGlzdGVuZXJXcmFwcGVyLmxpc3RlbmVycztcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIENyeXB0byBhbmQgdXRpbGl0eSBmdW5jdGlvbnNcblxuZnVuY3Rpb24gZW5jcnlwdChwYXlsb2FkOiBPYmplY3QsIGtleTogc3RyaW5nKSB7XG5cbiAgICB2YXIgZW5jcnlwdGlvbktleSA9IGZvcmdlLnBraS5wdWJsaWNLZXlGcm9tUGVtKGtleSk7XG4gICAgdmFyIHByZVByb2Nlc3NlZFBheWxvYWQgPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKTtcbiAgICB2YXIgZW5jcnlwdGVkUGF5bG9hZCA9ICcnO1xuXG4gICAgLy8gaGFuZGxlIG1lc3NhZ2VzIGxvbmdlciB0aGFuIHRoZSA0QiBrZXkgICAgXG4gICAgd2hpbGUgKHByZVByb2Nlc3NlZFBheWxvYWQpIHtcbiAgICAgICAgZW5jcnlwdGVkUGF5bG9hZCArPSBlbmNyeXB0aW9uS2V5LmVuY3J5cHQocHJlUHJvY2Vzc2VkUGF5bG9hZC5zbGljZSgwLCA1MDEpKTsgICAgICAgLy8gYmVjYXVzZSB0aGUga2V5IGlzIDQgS2JpdHMgYW5kIHBhZGRpbmcgaXMgMTEgQnl0ZXNcbiAgICAgICAgcHJlUHJvY2Vzc2VkUGF5bG9hZCA9IHByZVByb2Nlc3NlZFBheWxvYWQuc3Vic3RyKDUwMSwgcHJlUHJvY2Vzc2VkUGF5bG9hZC5sZW5ndGggLSAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW5jcnlwdGVkUGF5bG9hZDtcbn1cblxuZnVuY3Rpb24gZGVjcnlwdChwYXlsb2FkOiBzdHJpbmcpIHtcblxuICAgIHZhciBkZWNyeXB0aW9uS2V5ID0gZm9yZ2UucGtpLnByaXZhdGVLZXlGcm9tUGVtKGFwcERvY3VtZW50UmVmLnNldHRpbmdzLnByaXZhdGVLZXkpO1xuICAgIHZhciBkZWNyeXB0ZWRQYXlsb2FkU3RyaW5nID0gJyc7XG5cbiAgICAvLyBoYW5kbGUgbWVzc2FnZXMgbG9uZ2VyIHRoYW4gdGhlIDRCIGtleVxuICAgIHdoaWxlIChwYXlsb2FkKSB7XG4gICAgICAgIGRlY3J5cHRlZFBheWxvYWRTdHJpbmcgKz0gZGVjcnlwdGlvbktleS5kZWNyeXB0KHBheWxvYWQuc3Vic3RyKDAsIDUxMikpO1xuICAgICAgICBwYXlsb2FkID0gcGF5bG9hZC5zdWJzdHIoNTEyLCBwYXlsb2FkLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEpTT04ucGFyc2UoZGVjcnlwdGVkUGF5bG9hZFN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIGdldFJhbmRvbWlzaFN0cmluZygpIHtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7XG59Il19