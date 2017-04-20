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
function resetDatabase() {
    database = database.destroyDatabase();
    database = new nativescript_couchbase_1.Couchbase(DB_config.db_name);
}
// Pre-define Queries
database.createView('friends', '1', function (document, emitter) {
    if (document.documentType === 'Friend') {
        emitter.emit(document.timeLastMessage, document); // call back with this document;
    }
    ;
});
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
            firebase.push('/m/' + newFriendDocument._id, encryptedMessage)
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
        var myMessagesPath = '/m/' + myId;
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
    preProcessedPayload = forge.util.encodeUtf8(preProcessedPayload);
    preProcessedPayload = forge.util.encode64(preProcessedPayload);
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
    decryptedPayloadString = forge.util.decode64(decryptedPayloadString);
    decryptedPayloadString = forge.util.decodeUtf8(decryptedPayloadString);
    return JSON.parse(decryptedPayloadString);
}
function getRandomishString() {
    return Math.random().toString(36).slice(2);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpRUFBbUQ7QUFDbkQsdURBQXlEO0FBQ3pELGtDQUFvQztBQUVwQyxtREFBbUQ7QUFDbkQsb0RBQXNEO0FBRXRELHVCQUF1QjtBQUN2QixPQUFPO0FBQ1AsR0FBRztBQUNILDZJQUE2STtBQUM3SSwySEFBMkg7QUFDM0gsa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxrSUFBa0k7QUFDbEksR0FBRztBQUNILHVCQUF1QjtBQUd2QixrQ0FBa0M7QUFDbEMsSUFBTSxTQUFTLEdBQUc7SUFDZCxPQUFPLEVBQUUsY0FBYztDQUMxQixDQUFBO0FBQ0QsSUFBSSxRQUFRLEdBQUcsSUFBSSxrQ0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUdoRDtJQUNJLFFBQVEsR0FBRyxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDdEMsUUFBUSxHQUFHLElBQUksa0NBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDaEQsQ0FBQztBQUVELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVB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QyxHQUFHLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNwRixJQUFJLHNCQUFzQixHQUFHLEVBQUUsQ0FBQztJQUVoQyx5Q0FBeUM7SUFDekMsT0FBTyxPQUFPLEVBQUUsQ0FBQztRQUNiLHNCQUFzQixJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4RSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxzQkFBc0IsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3JFLHNCQUFzQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFFdkUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvdWNoYmFzZSB9IGZyb20gJ25hdGl2ZXNjcmlwdC1jb3VjaGJhc2UnO1xuaW1wb3J0ICogYXMgZmlyZWJhc2UgZnJvbSAnbmF0aXZlc2NyaXB0LXBsdWdpbi1maXJlYmFzZSc7XG5pbXBvcnQgKiBhcyBmb3JnZSBmcm9tICdub2RlLWZvcmdlJztcblxuaW1wb3J0IHsgRnJpZW5kLCBNZXNzYWdlIH0gZnJvbSAnLi9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgKiBhcyBub3RpZmljYXRpb25TZXJ2aWNlIGZyb20gJy4vbm90aWZpY2F0aW9uJztcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEFQSTpcbi8vIFxuLy8gaW5pdEZyaWVuZHNEYXRhKCkudGhlbig8ZG8gc3R1ZmY+KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGluaXRhbGlzZXMgdGhlIERhdGFiYXNlIGFuZCB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBnZXRGcmllbmRzTGlzdCgpLnRoZW4oIGZyaWVuZHNMaXN0ID0+IHsgPGRvIHN0dWZmIHdpdGggZnJpZW5kc0xpc3QgQXJyYXk+IH0gKSAgICAgICAgLS0gZ2V0cyB0aGUgZnJpZW5kc0xpc3QgYXMgYW4gQXJyYXlcbi8vIGFkZEZyaWVuZCg8ZnJpZW5kIG5pY2tuYW1lPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHJlbW92ZUZyaWVuZCg8ZnJpZW5kIF9pZD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHVwZGF0ZUZyaWVuZCg8ZnJpZW5kIF9pZD4sIDxuZXcgZGF0YSBjb250ZW50PikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBDb3VjaGJhc2UgaW5pdGlhbCBjb25maWd1cmF0aW9uXG5jb25zdCBEQl9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ2NvdWNoYmFzZS5kYicsXG59XG52YXIgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcblxuXG5mdW5jdGlvbiByZXNldERhdGFiYXNlKCkge1xuICAgIGRhdGFiYXNlID0gZGF0YWJhc2UuZGVzdHJveURhdGFiYXNlKCk7XG4gICAgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcbn1cblxuLy8gUHJlLWRlZmluZSBRdWVyaWVzXG5kYXRhYmFzZS5jcmVhdGVWaWV3KCdmcmllbmRzJywgJzEnLCAoZG9jdW1lbnQsIGVtaXR0ZXIpID0+IHtcbiAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRUeXBlID09PSAnRnJpZW5kJykge1xuICAgICAgICBlbWl0dGVyLmVtaXQoZG9jdW1lbnQudGltZUxhc3RNZXNzYWdlLCBkb2N1bWVudCk7ICAgICAvLyBjYWxsIGJhY2sgd2l0aCB0aGlzIGRvY3VtZW50O1xuICAgIH07XG59KTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBVdGlsaXR5IGZ1bmN0aW9ucyBleHBvc2VkIHRvIGFsbCBvdGhlciBWaWV3cywgd2hpY2ggYWJzdHJhY3QgYXdheSBjb21wbGV0ZWx5IGZyb20gdGhlIERCIGJhY2tlbmQuIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gR2VuZXJhbCBBcHAgZGV0YWlscyBkYXRhIGFuZCBEYXRhYmFzZSBpbml0YWxpc2F0aW9uXG5cbnZhciBhcHBEb2N1bWVudFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FwcERhdGFBbHJlYWR5SW5pdGlhbGlzZWQoKTogQm9vbGVhbiB7XG4gICAgaWYgKGFwcERvY3VtZW50UmVmKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBEYXRhIHtcblxuICAgIHByaXZhdGUgZmlyZWJhc2VJbml0ID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyB0b2tlbjogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZpcmViYXNlLmluaXQoe1xuXG4gICAgICAgICAgICAgICAgb25NZXNzYWdlUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKG5vdGlmaWNhdGlvbjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0cmlldmVBbGxNZXNzYWdlcygpLnRoZW4obWVzc2FnZXNBcnJheSA9PiBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0TmV3TWVzc2FnZXMobWVzc2FnZXNBcnJheSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGlmaWNhdGlvbi5uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVBZGRGcmllbmROb3RpZmljYXRpb25zKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobm90aWZpY2F0aW9uLmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZU1lc3NhZ2VSZWNlaXB0Tm90aWZpY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgb25QdXNoVG9rZW5SZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0QXBwRGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UubG9naW4oe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaXJlYmFzZS5Mb2dpblR5cGUuUEFTU1dPUkQsXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IGFwcERvY3VtZW50UmVmLnNldHRpbmdzLnJhbmRvbUlkZW50aXR5LnBhc3N3b3JkXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4odXNlciA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0Vycm9yOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdBcHAgSW5pdGlhbGlzZWQhJyk7ICAgICAgICAgICAvLyBkbyBub3Qgd2FpdCBmb3IgZmlyZWJhc2UgLSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIHNlZSBsb2NhbCBkYXRhXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2VuZXJhdGVSYW5kb21GaXJlYmFzZVVzZXIoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHJlc2V0RGF0YWJhc2UoKTtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuICAgICAgICAgICAgICAgIHZhciByYW5kb21FbWFpbCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgJ0AnICsgZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnLmNvbSc7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVBhc3N3b3JkID0gZm9yZ2UucmFuZG9tLmdldEJ5dGVzU3luYygzMik7XG5cbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5jcmVhdGVVc2VyKHtcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IHJhbmRvbUVtYWlsLFxuICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogcmFuZG9tUGFzc3dvcmRcbiAgICAgICAgICAgICAgICB9KS50aGVuKHVzZXIgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlTWVzc2FnaW5nVG9rZW46IGZpcmViYXNlTWVzc2FnaW5nVG9rZW5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgnRmFpbGVkIHRvIHJlZ2lzdGVyIEFub255bW91cyBpZGVudGl0eSBvbiByZW1vdGUgc2VydmVycyAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzYXZlUmFuZG9tVXNlckxvY2FsbHkodXNlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSBrZXkgcGFpciAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGtleXBhaXIgPSBmb3JnZS5wa2kucnNhLmdlbmVyYXRlS2V5UGFpcih7IGJpdHM6IDQwOTYsIGU6IDB4MTAwMDEgfSk7XG4gICAgICAgICAgICB2YXIgcHJpdmF0ZUtleSA9IGZvcmdlLnBraS5wcml2YXRlS2V5VG9QZW0oa2V5cGFpci5wcml2YXRlS2V5KTtcbiAgICAgICAgICAgIHZhciBwdWJsaWNLZXkgPSBmb3JnZS5wa2kucHVibGljS2V5VG9QZW0oa2V5cGFpci5wdWJsaWNLZXkpO1xuXG4gICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudCh7XG4gICAgICAgICAgICAgICAgYXBwTmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyUGF0aDogJ34vaW1hZ2VzL2F2YXRhci5wbmcnLFxuICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgICAgICAgICBmY21NZXNzYWdpbmdUb2tlbjogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICByYW5kb21JZGVudGl0eToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogdXNlci5wYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwcml2YXRlS2V5OiBwcml2YXRlS2V5LFxuICAgICAgICAgICAgICAgICAgICBwdWJsaWNLZXk6IHB1YmxpY0tleVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sICdzcXVlYWstYXBwJyk7XG4gICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICB1c2VyVUlEOiB1c2VyLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgICAgIGZpcmViYXNlTWVzc2FnaW5nVG9rZW46IHVzZXIuZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICBwdWJsaWNLZXk6IHB1YmxpY0tleVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVGaXJlYmFzZVJlY29yZHModXNlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgJy91LycgKyB1c2VyLnVzZXJVSUQsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBrOiB1c2VyLnB1YmxpY0tleSxcbiAgICAgICAgICAgICAgICAgICAgdDogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICB4OiBbXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGluaXRpYWxpc2VkLicpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gc2V0IFVzZXIgZGV0YWlscyBvbiByZW1vdGUgc2VydmVycyAnICsgZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuXG4vLyBMb2NhbCBhY2NvdW50IHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hMb2NhbEFjY291bnREZXRhaWxzKCkge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlTG9jYWxOaWNrbmFtZShuaWNrbmFtZSkge1xuICAgIHZhciBsb2NhbFNldHRpbmdzRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuICAgIGxvY2FsU2V0dGluZ3NEb2N1bWVudC5zZXR0aW5ncy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KCdzcXVlYWstYXBwJywgbG9jYWxTZXR0aW5nc0RvY3VtZW50KTtcbn1cblxuXG4vLyBGcmllbmRzIExpc3QgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGcmllbmQoZnJpZW5kSWQ6IHN0cmluZykge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmRJZCk7XG59XG5cbnZhciBnZXRGcmllbmRQdWJsaWNLZXkgPSBmdW5jdGlvbiAoZmlyZWJhc2VJZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgZnJpZW5kUHVibGljS2V5UGF0aCA9ICcvdS8nICsgZmlyZWJhc2VJZCArICcvay8nO1xuICAgICAgICBmaXJlYmFzZS5hZGRWYWx1ZUV2ZW50TGlzdGVuZXIoc25hcHNob3QgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShzbmFwc2hvdC52YWx1ZSk7XG4gICAgICAgIH0sIGZyaWVuZFB1YmxpY0tleVBhdGgpXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGdldEZyaWVuZHNMaXN0ID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyBmcmllbmRzTGlzdDogQXJyYXk8T2JqZWN0PiB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgZnJpZW5kc0xpc3RRdWVyeSA9IGRhdGFiYXNlLmV4ZWN1dGVRdWVyeSgnZnJpZW5kcycpO1xuICAgICAgICBpZiAoZnJpZW5kc0xpc3RRdWVyeSkge1xuXG4gICAgICAgICAgICB2YXIgc29ydGVkRnJpZW5kc0xpc3QgPSBmcmllbmRzTGlzdFF1ZXJ5LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZUEgPSBuZXcgRGF0ZShhLnRpbWVMYXN0TWVzc2FnZSkudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgIHZhciBkYXRlQiA9IG5ldyBEYXRlKGIudGltZUxhc3RNZXNzYWdlKS52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVCIC0gZGF0ZUE7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5ld2VzdCBhdCB0aGUgdG9wXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVzb2x2ZShmcmllbmRzTGlzdFF1ZXJ5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdCgnQ291bGQgbm90IG9idGFpbiBMaXN0IG9mIEZyaWVuZHMgZnJvbSBEYXRhYmFzZScpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgYWRkRnJpZW5kID0gZnVuY3Rpb24gKGZpcmViYXNlSWQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG15UHJvZmlsZSA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJykuc2V0dGluZ3M7XG4gICAgICAgIHZhciBhdXRob3Jpc2VkRnJpZW5kUGF0aCA9ICcvdS8nICsgbXlQcm9maWxlLmZpcmViYXNlVUlEICsgJy94LycgKyBmaXJlYmFzZUlkO1xuXG4gICAgICAgIC8vIGFkZCB0aGlzIHVzZXIgY29kZSAvIGZpcmViYXNlIElkIHRvIHRoZSBsaXN0IG9mIHBlb3BsZSB3aG8gY2FuIG1lc3NhZ2UgbWVcbiAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUoXG4gICAgICAgICAgICBhdXRob3Jpc2VkRnJpZW5kUGF0aCxcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgLy8gbm90aWZ5IGZyaWVuZCB3aXRoIG91ciBvd24gZGV0YWlsc1xuICAgICAgICAgICAgZ2V0RnJpZW5kUHVibGljS2V5KGZpcmViYXNlSWQpLnRoZW4ocHVibGljS2V5ID0+IHtcblxuICAgICAgICAgICAgICAgIHZhciBteURldGFpbHMgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5pY2tuYW1lOiBteVByb2ZpbGUubmlja25hbWUsXG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlSWQ6IG15UHJvZmlsZS5maXJlYmFzZVVJRFxuICAgICAgICAgICAgICAgICAgICAvLyBhdmF0YXI6XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgZW5jcnlwdGVkTXlEZXRhaWxzID0gZW5jcnlwdChteURldGFpbHMsIHB1YmxpY0tleSk7XG5cbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAnL24vJyArIGZpcmViYXNlSWQsXG4gICAgICAgICAgICAgICAgICAgIGVuY3J5cHRlZE15RGV0YWlsc1xuICAgICAgICAgICAgICAgICkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZyaWVuZFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KGZpcmViYXNlSWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGZyaWVuZFJlZiBkb2VzIG5vdCBleGlzdCwgaW5pdGlhbGlzZSB0ZW1wb3JhcnkgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIGlmICghZnJpZW5kUmVmKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgU2V0IHByZWxpbWluYXJ5IGRldGFpbHMgZGV0YWlscyBmb3IgZnJpZW5kXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RnJpZW5kID0gbmV3IEZyaWVuZCgnUGVuZGluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RnJpZW5kLmxhc3RNZXNzYWdlUHJldmlldyA9ICdXYWl0aW5nIGZvciBmcmllbmQgY29uZmlybWF0aW9uLi4uIChjb2RlOiAnICsgZmlyZWJhc2VJZCArICcpJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KG5ld0ZyaWVuZCwgZmlyZWJhc2VJZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgnQWRkZWQgTmV3IEZyaWVuZCcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG52YXIgaGFuZGxlQWRkRnJpZW5kTm90aWZpY2F0aW9ucyA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBteUlkID0gYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MuZmlyZWJhc2VVSUQ7XG4gICAgICAgIHZhciBldmVudExpc3RlbmVycztcbiAgICAgICAgdmFyIG15Tm90aWZpY2F0aW9uc1BhdGggPSAnL24vJyArIG15SWQ7XG5cbiAgICAgICAgZmlyZWJhc2UuYWRkVmFsdWVFdmVudExpc3RlbmVyKHNuYXBzaG90ID0+IHtcblxuICAgICAgICAgICAgLy8gb25seSBnZXQgZXhjaXRlZCB3aGVuIHRoaW5ncyBhcmUgQWRkZWQgdG8gdGhlIFBhdGgsIG5vdCBhbHNvIG9uIHRoZSBSZW1vdmUgZXZlbnQgd2hpY2ggaXMgdHJpZ2dlcmVkIGxhdGVyLlxuICAgICAgICAgICAgaWYgKHNuYXBzaG90LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleXNBcnJheSA9IE9iamVjdC5rZXlzKHNuYXBzaG90LnZhbHVlKTtcblxuICAgICAgICAgICAgICAgIGtleXNBcnJheS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmcmllbmQgPSBkZWNyeXB0KHNuYXBzaG90LnZhbHVlW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbG9jYWxGcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgYWxyZWFkeSBoYXZlIGEgcmVjb3JkIGZvciB0aGF0IGZyaWVuZCAoaS5lLiB0aGV5IGdhdmUgdXMgdGhlIGNvZGUpLCB1cGRhdGUgdGhlIEZyaWVuZCByZWNvcmRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2FsRnJpZW5kUmVmKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsRnJpZW5kUmVmLm5pY2tuYW1lID0gZnJpZW5kLm5pY2tuYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxGcmllbmRSZWYubGFzdE1lc3NhZ2VQcmV2aWV3ID0gJ05ldyBGcmllbmQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQsIGxvY2FsRnJpZW5kUmVmKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZENvbmZpcm1hdGlvbihmcmllbmQubmlja25hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhIHJlY29yZCBmb3IgdGhhdCBmcmllbmQgKGkuZS4gd2UgZ2F2ZSB0aGVtIHRoZSBjb2RlKSwgcmVxdWVzdCBwZXJtaXNzaW9uIHRvIGFkZCB0aGVtIHRvIG91ciBmcmllbmRzIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblNlcnZpY2UuYWxlcnRGcmllbmRSZXF1ZXN0KGZyaWVuZC5uaWNrbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjb25maXJtYXRpb24gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB3ZSByZWNlaXZlIGEgdHJ1ZSB2YWx1ZSAoPT0gYWNjZXB0KSBmcm9tIHRoZSBQcm9taXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25maXJtYXRpb24pIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRkIEZyaWVuZCByZWNvcmQgd2l0aCBpbml0aWFsIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkRnJpZW5kKGZyaWVuZC5maXJlYmFzZUlkKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gdXBkYXRlIHdpdGggdGhlIGFjdHVhbCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbG9jYWxGcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxGcmllbmRSZWYubmlja25hbWUgPSBmcmllbmQubmlja25hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxGcmllbmRSZWYubGFzdE1lc3NhZ2VQcmV2aWV3ID0gJ05ldyBGcmllbmQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGZyaWVuZC5maXJlYmFzZUlkLCBsb2NhbEZyaWVuZFJlZik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kQ29uZmlybWF0aW9uKGZyaWVuZC5uaWNrbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZXZlbnRMaXN0ZW5lcnMsIG15Tm90aWZpY2F0aW9uc1BhdGgpO1xuICAgICAgICAgICAgICAgIGZpcmViYXNlLnNldFZhbHVlKG15Tm90aWZpY2F0aW9uc1BhdGgsIG51bGwpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FsbCBub3RpZmljYXRpb25zIHJldHJpZXZlZCcpO1xuXG4gICAgICAgICAgICB9IGVsc2UgcmVqZWN0KCdDb3VsZCBub3QgZmluZCBhbnkgbm90aWZpY2F0aW9uIG9uIEZpcmViYXNlJyk7XG5cbiAgICAgICAgfSwgbXlOb3RpZmljYXRpb25zUGF0aCkudGhlbihsaXN0ZW5lcldyYXBwZXIgPT4ge1xuXG4gICAgICAgICAgICAvLyBnZXQgZXZlbnRMaXN0ZW5lcnMgcmVmXG4gICAgICAgICAgICBldmVudExpc3RlbmVycyA9IGxpc3RlbmVyV3JhcHBlci5saXN0ZW5lcnM7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAvLyBnZXQgdGhlIHBhdGggdG8gdGhlIHBlcm1pc3Npb24gZW50cnkgdG8gcmVtb3ZlXG4gICAgICAgIHZhciBwZXJtaXNzaW9uUGF0aCA9ICcvdS8nICsgYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MuZmlyZWJhc2VVSUQgKyAnL3gvJ1xuICAgICAgICBmaXJlYmFzZS5xdWVyeShyZXN1bHQgPT4ge1xuXG4gICAgICAgICAgICAvLyBvbmx5IGdldCBleGNpdGVkIGlmIHdlIGFjdHVhbGx5IGZpbmQgdGhlIHBlcm1pc3Npb24gcmVjb3JkXG4gICAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IE9iamVjdC5rZXlzKHJlc3VsdC52YWx1ZSlbMF07ICAvLyA9PSB0aGUga2V5IHRvIHRoZSByZWNvcmQgdG8gcmVtb3ZlXG5cbiAgICAgICAgICAgICAgICAvLyBzZXQgdGhlIHRhcmdldCBwYXRoIHRvIG51bGxcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShwZXJtaXNzaW9uUGF0aCArIHRhcmdldCwgbnVsbCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiBkZWxldGUgdGhlIGxvY2FsIHJlY29yZCBhbmQgcmVzb2x2ZVxuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ1JlbW92ZWQgRnJpZW5kJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlLmRlbGV0ZURvY3VtZW50KHRhcmdldElkKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdGcmllbmQgZGlkIG5vdCBoYXZlIHBlcm1pc3Npb25zIHRvIG1lc3NhZ2UgeW91Jyk7ICAgICAgLy8gPT0gdGhlIGZpcmViYXNlIHJlY29yZCB3YXMgcHJldmlvdXNseSBkZWxldGVkIChzaG91bGQgbm90IGhhcHBlbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgICAgIHBlcm1pc3Npb25QYXRoLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpbmdsZUV2ZW50OiB0cnVlLFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlyZWJhc2UuUXVlcnlPcmRlckJ5VHlwZS5WQUxVRSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciB1cGRhdGVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZERvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoY2hhdElkKTtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc3RvcmUgdGhlIG1lc3NhZ2UgaW4gbWVtb3J5ICBcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlQXV0aG9yID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5zZXR0aW5ncy5maXJlYmFzZVVJRDtcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnU2VuZGluZy4uLic7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlSW5kZXggPSBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcblxuICAgICAgICAvLyBwcmVwYXJlIG1lc3NhZ2UgZm9yIHNlbmRpbmdcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBtZXNzYWdlQXV0aG9yOiBuZXdNZXNzYWdlLm1lc3NhZ2VBdXRob3IsXG4gICAgICAgICAgICBtZXNzYWdlVGV4dDogbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCxcbiAgICAgICAgICAgIG1lc3NhZ2VUaW1lU2VudDogbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBnZXQgZW5jcnlwdGlvbiBrZXlcbiAgICAgICAgZ2V0RnJpZW5kUHVibGljS2V5KGNoYXRJZCkudGhlbihwdWJsaWNLZXkgPT4ge1xuXG4gICAgICAgICAgICB2YXIgZW5jcnlwdGVkTWVzc2FnZSA9IGVuY3J5cHQobWVzc2FnZSwgcHVibGljS2V5KTtcblxuICAgICAgICAgICAgLy8gcHVzaCBtZXNzYWdlIHRvIGZpcmViYXNlXG4gICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICcvbS8nICsgbmV3RnJpZW5kRG9jdW1lbnQuX2lkLFxuICAgICAgICAgICAgICAgIGVuY3J5cHRlZE1lc3NhZ2VcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAvL3RoZW4gdXBkYXRlIHRoZSBsb2NhbCBzdGF0ZSAgICBcbiAgICAgICAgICAgICAgICAudGhlbihjb25maXJtYXRpb24gPT4ge1xuICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJTZW50XCI7XG4gICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLmlkID0gY29uZmlybWF0aW9uLmtleTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ01lc3NhZ2UgU2VudCcpO1xuXG4gICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJGYWlsZWRcIjtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJldHJpZXZlQWxsTWVzc2FnZXMoKTogUHJvbWlzZTxBcnJheTxPYmplY3Q+PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgbXlJZCA9IGFwcERvY3VtZW50UmVmLnNldHRpbmdzLmZpcmViYXNlVUlEO1xuICAgICAgICB2YXIgZXZlbnRMaXN0ZW5lcnM7XG4gICAgICAgIHZhciBteU1lc3NhZ2VzUGF0aCA9ICcvbS8nICsgbXlJZDtcblxuICAgICAgICBmaXJlYmFzZS5hZGRWYWx1ZUV2ZW50TGlzdGVuZXIoc25hcHNob3QgPT4ge1xuXG4gICAgICAgICAgICAvLyBvbmx5IGdldCBleGNpdGVkIHdoZW4gdGhpbmdzIGFyZSBBZGRlZCB0byB0aGUgUGF0aCwgbm90IGFsc28gb24gdGhlIFJlbW92ZSBldmVudCB3aGljaCBpcyB0cmlnZ2VyZWQgbGF0ZXIuXG4gICAgICAgICAgICBpZiAoc25hcHNob3QudmFsdWUpIHtcblxuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlc0FycmF5ID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGtleXNBcnJheSA9IE9iamVjdC5rZXlzKHNuYXBzaG90LnZhbHVlKTtcbiAgICAgICAgICAgICAgICBrZXlzQXJyYXkuZm9yRWFjaChrZXkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWNyeXB0ZWRNZXNzYWdlID0gZGVjcnlwdChzbmFwc2hvdC52YWx1ZVtrZXldKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgbmV3IE1lc3NhZ2UoKSBmb3IgbG9jYWwgY29uc3VtcHRpb25cbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZSgnJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLmlkID0ga2V5O1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VBdXRob3IgPSBkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VBdXRob3I7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRleHQgPSBkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRpbWVTZW50KTtcbiAgICAgICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlU3RhdHVzID0gJ1JlY2VpdmVkJztcblxuICAgICAgICAgICAgICAgICAgICAvLyBzYXZlIHRoaXMgbWVzc2FnZSB0byByZXR1cm4gdG8gdGhlIG5vdGlmaWNhdGlvbiBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VzQXJyYXkucHVzaChuZXdNZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgdXBkYXRlZCBGcmllbmQgUmVjb3JkXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRGcmllbmQgPSBnZXRGcmllbmQoZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlQXV0aG9yKTtcblxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQubWVzc2FnZXMucHVzaChuZXdNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnRpbWVMYXN0TWVzc2FnZSA9IG5ld01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLmxhc3RNZXNzYWdlUHJldmlldyA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC51bnJlYWRNZXNzYWdlc051bWJlciArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZW4gc29ydCB0aGUgbWVzc2FnZXMuIGZvciBzb3J0aW5nIGFycmF5cywgc2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9zb3J0XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC5tZXNzYWdlcyA9IHRhcmdldEZyaWVuZC5tZXNzYWdlcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0ZUEgPSBuZXcgRGF0ZShhLm1lc3NhZ2VUaW1lU2VudCkudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGVCID0gbmV3IERhdGUoYi5tZXNzYWdlVGltZVNlbnQpLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlQSAtIGRhdGVCO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGRhdGFiYXNlXG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZUF1dGhvciwgdGFyZ2V0RnJpZW5kKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBub3RpZnkgc2VuZGVyIG9mIHJlY2VpcHRcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybU1lc3NhZ2VSZWNlaXB0KG15SWQsIGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZUF1dGhvciwgbmV3TWVzc2FnZS5pZCwgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGZpcmViYXNlLnJlbW92ZUV2ZW50TGlzdGVuZXJzKGV2ZW50TGlzdGVuZXJzLCBteU1lc3NhZ2VzUGF0aCk7XG4gICAgICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUobXlNZXNzYWdlc1BhdGgsIG51bGwpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobWVzc2FnZXNBcnJheSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSByZWplY3QoJ0NvdWxkIG5vdCBmaW5kIGFueSBtZXNzYWdlIG9uIEZpcmViYXNlJyk7XG5cbiAgICAgICAgfSwgbXlNZXNzYWdlc1BhdGgpLnRoZW4obGlzdGVuZXJXcmFwcGVyID0+IHtcblxuICAgICAgICAgICAgLy8gZ2V0IGV2ZW50TGlzdGVuZXJzIHJlZlxuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lcnMgPSBsaXN0ZW5lcldyYXBwZXIubGlzdGVuZXJzO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29uZmlybU1lc3NhZ2VSZWNlaXB0KG15SWQsIGF1dGhvciwgbWVzc2FnZUlkLCB0aW1lUmVjZWl2ZWQpIHtcbiAgICB2YXIgbm90aWZpY2F0aW9uUGF0aCA9ICcvYy8nICsgYXV0aG9yO1xuICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICBpZDogbWVzc2FnZUlkLFxuICAgICAgICBzZW5kZXI6IG15SWQsXG4gICAgICAgIHRpbWVSZWNlaXZlZDogdGltZVJlY2VpdmVkXG4gICAgfTtcblxuICAgIGdldEZyaWVuZFB1YmxpY0tleShhdXRob3IpLnRoZW4ocHVibGljS2V5ID0+IHtcbiAgICAgICAgdmFyIGVuY3J5cHRlZFBheWxvYWQgPSBlbmNyeXB0KHBheWxvYWQsIHB1YmxpY0tleSk7XG4gICAgICAgIGZpcmViYXNlLnB1c2gobm90aWZpY2F0aW9uUGF0aCwgZW5jcnlwdGVkUGF5bG9hZCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2VSZWNlaXB0Tm90aWZpY2F0aW9uKCk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG15SWQgPSBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5maXJlYmFzZVVJRDtcbiAgICAgICAgdmFyIGV2ZW50TGlzdGVuZXJzO1xuICAgICAgICB2YXIgbXlDb25maXJtYXRpb25zUGF0aCA9ICcvYy8nICsgbXlJZDtcblxuICAgICAgICBmaXJlYmFzZS5hZGRWYWx1ZUV2ZW50TGlzdGVuZXIoc25hcHNob3QgPT4ge1xuXG4gICAgICAgICAgICAvLyBvbmx5IGdldCBleGNpdGVkIHdoZW4gdGhpbmdzIGFyZSBBZGRlZCB0byB0aGUgUGF0aCwgbm90IGFsc28gb24gdGhlIFJlbW92ZSBldmVudCB3aGljaCBpcyB0cmlnZ2VyZWQgbGF0ZXIuXG4gICAgICAgICAgICBpZiAoc25hcHNob3QudmFsdWUpIHtcblxuICAgICAgICAgICAgICAgIHZhciBrZXlzQXJyYXkgPSBPYmplY3Qua2V5cyhzbmFwc2hvdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAga2V5c0FycmF5LmZvckVhY2goa2V5ID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCBjb25maXJtYXRpb24gbG9nZ2VkIG9uIGZpcmViYXNlLCBkZWNyeXB0ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlY3J5cHRlZENvbmZpcm1hdGlvbiA9IGRlY3J5cHQoc25hcHNob3QudmFsdWVba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmcmllbmQgPSBkYXRhYmFzZS5nZXREb2N1bWVudChkZWNyeXB0ZWRDb25maXJtYXRpb24uc2VuZGVyKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB0aGVuIGZpbmQgdGhlIG1lc3NhZ2UgaXQgcmVsYXRlcyB0byBhbmQgY2hhbmdlIGl0cyBzdGF0dXMgYW5kIHRpbWUgcmVjZWl2ZWQgcHJvcGVydGllcyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZyaWVuZC5tZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlY3J5cHRlZENvbmZpcm1hdGlvbi5pZCA9PT0gbWVzc2FnZS5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UubWVzc2FnZVN0YXR1cyA9ICdSZWNlaXZlZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkID0gZGVjcnlwdGVkQ29uZmlybWF0aW9uLnRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoZGVjcnlwdGVkQ29uZmlybWF0aW9uLnNlbmRlciwgZnJpZW5kKTtcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5yZWZyZXNoTWVzc2FnZVN0YXR1cyhkZWNyeXB0ZWRDb25maXJtYXRpb24uc2VuZGVyKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgdHJpZ2dlcmluZyB0aGUgZXZlbnQgbGlzdGVuZXIgcmVjdXJzaXZlbHksIHRoZW4gY2xlYXIgdGhlIHJlY29yZCBvbiBmaXJlYmFzZVxuICAgICAgICAgICAgICAgIGZpcmViYXNlLnJlbW92ZUV2ZW50TGlzdGVuZXJzKGV2ZW50TGlzdGVuZXJzLCBteUNvbmZpcm1hdGlvbnNQYXRoKTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShteUNvbmZpcm1hdGlvbnNQYXRoLCBudWxsKTtcblxuICAgICAgICAgICAgICAgIC8vIHRoZW4gcmVzb2x2ZSBQcm9taXNlXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQWxsIG5vdGlmaWNhdGlvbnMgY29sbGVjdGVkJyk7XG5cbiAgICAgICAgICAgIH0gZWxzZSByZWplY3QoJ0ZhaWxlZCB0byByZXRyaWV2ZSBhbGwgbm90aWZpY2F0aW9ucycpO1xuXG4gICAgICAgIH0sIG15Q29uZmlybWF0aW9uc1BhdGgpXG4gICAgICAgICAgICAudGhlbihsaXN0ZW5lcldyYXBwZXIgPT4ge1xuXG4gICAgICAgICAgICAgICAgLy8gZ2V0IGV2ZW50TGlzdGVuZXJzIHJlZlxuICAgICAgICAgICAgICAgIGV2ZW50TGlzdGVuZXJzID0gbGlzdGVuZXJXcmFwcGVyLmxpc3RlbmVycztcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIENyeXB0byBhbmQgdXRpbGl0eSBmdW5jdGlvbnNcblxuZnVuY3Rpb24gZW5jcnlwdChwYXlsb2FkOiBPYmplY3QsIGtleTogc3RyaW5nKSB7XG5cbiAgICB2YXIgZW5jcnlwdGlvbktleSA9IGZvcmdlLnBraS5wdWJsaWNLZXlGcm9tUGVtKGtleSk7XG4gICAgdmFyIHByZVByb2Nlc3NlZFBheWxvYWQgPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKTtcbiAgICBwcmVQcm9jZXNzZWRQYXlsb2FkID0gZm9yZ2UudXRpbC5lbmNvZGVVdGY4KHByZVByb2Nlc3NlZFBheWxvYWQpO1xuICAgIHByZVByb2Nlc3NlZFBheWxvYWQgPSBmb3JnZS51dGlsLmVuY29kZTY0KHByZVByb2Nlc3NlZFBheWxvYWQpO1xuICAgIHZhciBlbmNyeXB0ZWRQYXlsb2FkID0gJyc7XG5cbiAgICAvLyBoYW5kbGUgbWVzc2FnZXMgbG9uZ2VyIHRoYW4gdGhlIDRCIGtleSAgICBcbiAgICB3aGlsZSAocHJlUHJvY2Vzc2VkUGF5bG9hZCkge1xuICAgICAgICBlbmNyeXB0ZWRQYXlsb2FkICs9IGVuY3J5cHRpb25LZXkuZW5jcnlwdChwcmVQcm9jZXNzZWRQYXlsb2FkLnNsaWNlKDAsIDUwMSkpOyAgICAgICAvLyBiZWNhdXNlIHRoZSBrZXkgaXMgNCBLYml0cyBhbmQgcGFkZGluZyBpcyAxMSBCeXRlc1xuICAgICAgICBwcmVQcm9jZXNzZWRQYXlsb2FkID0gcHJlUHJvY2Vzc2VkUGF5bG9hZC5zdWJzdHIoNTAxLCBwcmVQcm9jZXNzZWRQYXlsb2FkLmxlbmd0aCAtIDEpO1xuICAgIH1cblxuICAgIHJldHVybiBlbmNyeXB0ZWRQYXlsb2FkO1xufVxuXG5mdW5jdGlvbiBkZWNyeXB0KHBheWxvYWQ6IHN0cmluZykge1xuXG4gICAgdmFyIGRlY3J5cHRpb25LZXkgPSBmb3JnZS5wa2kucHJpdmF0ZUtleUZyb21QZW0oYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucHJpdmF0ZUtleSk7XG4gICAgdmFyIGRlY3J5cHRlZFBheWxvYWRTdHJpbmcgPSAnJztcblxuICAgIC8vIGhhbmRsZSBtZXNzYWdlcyBsb25nZXIgdGhhbiB0aGUgNEIga2V5XG4gICAgd2hpbGUgKHBheWxvYWQpIHtcbiAgICAgICAgZGVjcnlwdGVkUGF5bG9hZFN0cmluZyArPSBkZWNyeXB0aW9uS2V5LmRlY3J5cHQocGF5bG9hZC5zdWJzdHIoMCwgNTEyKSk7XG4gICAgICAgIHBheWxvYWQgPSBwYXlsb2FkLnN1YnN0cig1MTIsIHBheWxvYWQubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBkZWNyeXB0ZWRQYXlsb2FkU3RyaW5nID0gZm9yZ2UudXRpbC5kZWNvZGU2NChkZWNyeXB0ZWRQYXlsb2FkU3RyaW5nKTtcbiAgICBkZWNyeXB0ZWRQYXlsb2FkU3RyaW5nID0gZm9yZ2UudXRpbC5kZWNvZGVVdGY4KGRlY3J5cHRlZFBheWxvYWRTdHJpbmcpO1xuXG4gICAgcmV0dXJuIEpTT04ucGFyc2UoZGVjcnlwdGVkUGF5bG9hZFN0cmluZyk7XG59XG5cbmZ1bmN0aW9uIGdldFJhbmRvbWlzaFN0cmluZygpIHtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7XG59Il19