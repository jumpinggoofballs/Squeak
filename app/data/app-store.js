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
                        if (notification.messageToFetch) {
                            retrieveAllMessages().then(function (messagesArray) { return notificationService.alertNewMessages(messagesArray); });
                        }
                        if (notification.myDetails) {
                            handleAddFriendNotification(notification.notificationId, notification.myDetails);
                        }
                        if (notification.m) {
                            handleMessageReceiptNotification(notification.m).then(function (chatId) { return notificationService.refreshMessageStatus(chatId); });
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
        var path = '/u/' + myProfile.firebaseUID + '/x';
        // add this user code / firebase Id to the list of people who can message me
        firebase.push(path, firebaseId).then(function () {
            // notify friend with our own details
            getFriendPublicKey(firebaseId).then(function (publicKey) {
                var myDetails = {
                    nickname: myProfile.nickname,
                    firebaseId: myProfile.firebaseUID
                };
                var encryptedMyDetails = encrypt(myDetails, publicKey);
                firebase.push('/n/', {
                    targetUser: firebaseId,
                    myDetails: encryptedMyDetails
                }).then(function () {
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
function handleAddFriendNotification(notificationId, encryptedFriendDetails) {
    var friend = decrypt(encryptedFriendDetails);
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
}
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
function handleMessageReceiptNotification(encryptedNotification) {
    return new Promise(function (resolve, reject) {
        var notification = decrypt(encryptedNotification);
        var friend = database.getDocument(notification.sender);
        friend.messages.forEach(function (message) {
            if (notification.id === message.id) {
                message.messageStatus = 'Received';
                message.messageTimeReceived = notification.timeReceived;
                database.updateDocument(notification.sender, friend);
                resolve(notification.sender);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpRUFBbUQ7QUFDbkQsdURBQXlEO0FBQ3pELGtDQUFvQztBQUVwQyxtREFBbUQ7QUFDbkQsb0RBQXNEO0FBRXRELHVCQUF1QjtBQUN2QixPQUFPO0FBQ1AsR0FBRztBQUNILDZJQUE2STtBQUM3SSwySEFBMkg7QUFDM0gsa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxrSUFBa0k7QUFDbEksR0FBRztBQUNILHVCQUF1QjtBQUd2QixrQ0FBa0M7QUFDbEMsSUFBTSxTQUFTLEdBQUc7SUFDZCxPQUFPLEVBQUUsY0FBYztDQUMxQixDQUFBO0FBQ0QsSUFBSSxRQUFRLEdBQUcsSUFBSSxrQ0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUVoRCxxQkFBcUI7QUFDckIsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLFVBQUMsUUFBUSxFQUFFLE9BQU87SUFDbEQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFLLGdDQUFnQztJQUMxRixDQUFDO0lBQUEsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBRUg7SUFDSSxRQUFRLEdBQUcsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3RDLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2hELENBQUM7QUFFRCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVB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QUUsQ0FBQztJQUUxQiw2Q0FBNkM7SUFDN0MsT0FBTyxtQkFBbUIsRUFBRSxDQUFDO1FBQ3pCLGdCQUFnQixJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQU8scURBQXFEO1FBQ3pJLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFFRCxNQUFNLENBQUMsZ0JBQWdCLENBQUM7QUFDNUIsQ0FBQztBQUVELGlCQUFpQixPQUFlO0lBRTVCLElBQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNwRixJQUFJLHNCQUFzQixHQUFHLEVBQUUsQ0FBQztJQUVoQyx5Q0FBeUM7SUFDekMsT0FBTyxPQUFPLEVBQUUsQ0FBQztRQUNiLHNCQUFzQixJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4RSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ291Y2hiYXNlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWNvdWNoYmFzZSc7XG5pbXBvcnQgKiBhcyBmaXJlYmFzZSBmcm9tICduYXRpdmVzY3JpcHQtcGx1Z2luLWZpcmViYXNlJztcbmltcG9ydCAqIGFzIGZvcmdlIGZyb20gJ25vZGUtZm9yZ2UnO1xuXG5pbXBvcnQgeyBGcmllbmQsIE1lc3NhZ2UgfSBmcm9tICcuL2FwcC1kYXRhLW1vZGVsJztcbmltcG9ydCAqIGFzIG5vdGlmaWNhdGlvblNlcnZpY2UgZnJvbSAnLi9ub3RpZmljYXRpb24nO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gQVBJOlxuLy8gXG4vLyBpbml0RnJpZW5kc0RhdGEoKS50aGVuKDxkbyBzdHVmZj4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gaW5pdGFsaXNlcyB0aGUgRGF0YWJhc2UgYW5kIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIGdldEZyaWVuZHNMaXN0KCkudGhlbiggZnJpZW5kc0xpc3QgPT4geyA8ZG8gc3R1ZmYgd2l0aCBmcmllbmRzTGlzdCBBcnJheT4gfSApICAgICAgICAtLSBnZXRzIHRoZSBmcmllbmRzTGlzdCBhcyBhbiBBcnJheVxuLy8gYWRkRnJpZW5kKDxmcmllbmQgbmlja25hbWU+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gcmVtb3ZlRnJpZW5kKDxmcmllbmQgX2lkPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gdXBkYXRlRnJpZW5kKDxmcmllbmQgX2lkPiwgPG5ldyBkYXRhIGNvbnRlbnQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIENvdWNoYmFzZSBpbml0aWFsIGNvbmZpZ3VyYXRpb25cbmNvbnN0IERCX2NvbmZpZyA9IHtcbiAgICBkYl9uYW1lOiAnY291Y2hiYXNlLmRiJyxcbn1cbnZhciBkYXRhYmFzZSA9IG5ldyBDb3VjaGJhc2UoREJfY29uZmlnLmRiX25hbWUpO1xuXG4vLyBQcmUtZGVmaW5lIFF1ZXJpZXNcbmRhdGFiYXNlLmNyZWF0ZVZpZXcoJ2ZyaWVuZHMnLCAnMScsIChkb2N1bWVudCwgZW1pdHRlcikgPT4ge1xuICAgIGlmIChkb2N1bWVudC5kb2N1bWVudFR5cGUgPT09ICdGcmllbmQnKSB7XG4gICAgICAgIGVtaXR0ZXIuZW1pdChkb2N1bWVudC50aW1lTGFzdE1lc3NhZ2UsIGRvY3VtZW50KTsgICAgIC8vIGNhbGwgYmFjayB3aXRoIHRoaXMgZG9jdW1lbnQ7XG4gICAgfTtcbn0pO1xuXG5mdW5jdGlvbiByZXNldERhdGFiYXNlKCkge1xuICAgIGRhdGFiYXNlID0gZGF0YWJhc2UuZGVzdHJveURhdGFiYXNlKCk7XG4gICAgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBVdGlsaXR5IGZ1bmN0aW9ucyBleHBvc2VkIHRvIGFsbCBvdGhlciBWaWV3cywgd2hpY2ggYWJzdHJhY3QgYXdheSBjb21wbGV0ZWx5IGZyb20gdGhlIERCIGJhY2tlbmQuIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gR2VuZXJhbCBBcHAgZGV0YWlscyBkYXRhIGFuZCBEYXRhYmFzZSBpbml0YWxpc2F0aW9uXG5cbnZhciBhcHBEb2N1bWVudFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FwcERhdGFBbHJlYWR5SW5pdGlhbGlzZWQoKTogQm9vbGVhbiB7XG4gICAgaWYgKGFwcERvY3VtZW50UmVmKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBEYXRhIHtcblxuICAgIHByaXZhdGUgZmlyZWJhc2VJbml0ID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyB0b2tlbjogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZpcmViYXNlLmluaXQoe1xuXG4gICAgICAgICAgICAgICAgb25NZXNzYWdlUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKG5vdGlmaWNhdGlvbjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubWVzc2FnZVRvRmV0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHJpZXZlQWxsTWVzc2FnZXMoKS50aGVuKG1lc3NhZ2VzQXJyYXkgPT4gbm90aWZpY2F0aW9uU2VydmljZS5hbGVydE5ld01lc3NhZ2VzKG1lc3NhZ2VzQXJyYXkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubXlEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVBZGRGcmllbmROb3RpZmljYXRpb24obm90aWZpY2F0aW9uLm5vdGlmaWNhdGlvbklkLCBub3RpZmljYXRpb24ubXlEZXRhaWxzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlTWVzc2FnZVJlY2VpcHROb3RpZmljYXRpb24obm90aWZpY2F0aW9uLm0pLnRoZW4oY2hhdElkID0+IG5vdGlmaWNhdGlvblNlcnZpY2UucmVmcmVzaE1lc3NhZ2VTdGF0dXMoY2hhdElkKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgb25QdXNoVG9rZW5SZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0QXBwRGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UubG9naW4oe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaXJlYmFzZS5Mb2dpblR5cGUuUEFTU1dPUkQsXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IGFwcERvY3VtZW50UmVmLnNldHRpbmdzLnJhbmRvbUlkZW50aXR5LnBhc3N3b3JkXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4odXNlciA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0Vycm9yOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdBcHAgSW5pdGlhbGlzZWQhJyk7ICAgICAgICAgICAvLyBkbyBub3Qgd2FpdCBmb3IgZmlyZWJhc2UgLSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIHNlZSBsb2NhbCBkYXRhXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2VuZXJhdGVSYW5kb21GaXJlYmFzZVVzZXIoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHJlc2V0RGF0YWJhc2UoKTtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuICAgICAgICAgICAgICAgIHZhciByYW5kb21FbWFpbCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgJ0AnICsgZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnLmNvbSc7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVBhc3N3b3JkID0gZm9yZ2UucmFuZG9tLmdldEJ5dGVzU3luYygzMik7XG5cbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5jcmVhdGVVc2VyKHtcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IHJhbmRvbUVtYWlsLFxuICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogcmFuZG9tUGFzc3dvcmRcbiAgICAgICAgICAgICAgICB9KS50aGVuKHVzZXIgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlTWVzc2FnaW5nVG9rZW46IGZpcmViYXNlTWVzc2FnaW5nVG9rZW5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgnRmFpbGVkIHRvIHJlZ2lzdGVyIEFub255bW91cyBpZGVudGl0eSBvbiByZW1vdGUgc2VydmVycyAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzYXZlUmFuZG9tVXNlckxvY2FsbHkodXNlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSBrZXkgcGFpciAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGtleXBhaXIgPSBmb3JnZS5wa2kucnNhLmdlbmVyYXRlS2V5UGFpcih7IGJpdHM6IDQwOTYsIGU6IDB4MTAwMDEgfSk7XG4gICAgICAgICAgICB2YXIgcHJpdmF0ZUtleSA9IGZvcmdlLnBraS5wcml2YXRlS2V5VG9QZW0oa2V5cGFpci5wcml2YXRlS2V5KTtcbiAgICAgICAgICAgIHZhciBwdWJsaWNLZXkgPSBmb3JnZS5wa2kucHVibGljS2V5VG9QZW0oa2V5cGFpci5wdWJsaWNLZXkpO1xuXG4gICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudCh7XG4gICAgICAgICAgICAgICAgYXBwTmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyUGF0aDogJ34vaW1hZ2VzL2F2YXRhci5wbmcnLFxuICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgICAgICAgICBmY21NZXNzYWdpbmdUb2tlbjogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICByYW5kb21JZGVudGl0eToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogdXNlci5wYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwcml2YXRlS2V5OiBwcml2YXRlS2V5LFxuICAgICAgICAgICAgICAgICAgICBwdWJsaWNLZXk6IHB1YmxpY0tleVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sICdzcXVlYWstYXBwJyk7XG4gICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICB1c2VyVUlEOiB1c2VyLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgICAgIGZpcmViYXNlTWVzc2FnaW5nVG9rZW46IHVzZXIuZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICBwdWJsaWNLZXk6IHB1YmxpY0tleVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVGaXJlYmFzZVJlY29yZHModXNlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgJy91LycgKyB1c2VyLnVzZXJVSUQsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBrOiB1c2VyLnB1YmxpY0tleSxcbiAgICAgICAgICAgICAgICAgICAgdDogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICB4OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgejogW11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGluaXRpYWxpc2VkLicpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gc2V0IFVzZXIgZGV0YWlscyBvbiByZW1vdGUgc2VydmVycyAnICsgZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuXG4vLyBMb2NhbCBhY2NvdW50IHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hMb2NhbEFjY291bnREZXRhaWxzKCkge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlTG9jYWxOaWNrbmFtZShuaWNrbmFtZSkge1xuICAgIHZhciBsb2NhbFNldHRpbmdzRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuICAgIGxvY2FsU2V0dGluZ3NEb2N1bWVudC5zZXR0aW5ncy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KCdzcXVlYWstYXBwJywgbG9jYWxTZXR0aW5nc0RvY3VtZW50KTtcbn1cblxuXG4vLyBGcmllbmRzIExpc3QgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGcmllbmQoZnJpZW5kSWQ6IHN0cmluZykge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmRJZCk7XG59XG5cbnZhciBnZXRGcmllbmRQdWJsaWNLZXkgPSBmdW5jdGlvbiAoZmlyZWJhc2VJZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgZnJpZW5kUHVibGljS2V5UGF0aCA9ICcvdS8nICsgZmlyZWJhc2VJZCArICcvay8nO1xuICAgICAgICBmaXJlYmFzZS5hZGRWYWx1ZUV2ZW50TGlzdGVuZXIoc25hcHNob3QgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShzbmFwc2hvdC52YWx1ZSk7XG4gICAgICAgIH0sIGZyaWVuZFB1YmxpY0tleVBhdGgpXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGdldEZyaWVuZHNMaXN0ID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyBmcmllbmRzTGlzdDogQXJyYXk8T2JqZWN0PiB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgZnJpZW5kc0xpc3RRdWVyeSA9IGRhdGFiYXNlLmV4ZWN1dGVRdWVyeSgnZnJpZW5kcycpO1xuICAgICAgICBpZiAoZnJpZW5kc0xpc3RRdWVyeSkge1xuXG4gICAgICAgICAgICB2YXIgc29ydGVkRnJpZW5kc0xpc3QgPSBmcmllbmRzTGlzdFF1ZXJ5LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZUEgPSBuZXcgRGF0ZShhLnRpbWVMYXN0TWVzc2FnZSkudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgIHZhciBkYXRlQiA9IG5ldyBEYXRlKGIudGltZUxhc3RNZXNzYWdlKS52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVCIC0gZGF0ZUE7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5ld2VzdCBhdCB0aGUgdG9wXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVzb2x2ZShmcmllbmRzTGlzdFF1ZXJ5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdCgnQ291bGQgbm90IG9idGFpbiBMaXN0IG9mIEZyaWVuZHMgZnJvbSBEYXRhYmFzZScpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgYWRkRnJpZW5kID0gZnVuY3Rpb24gKGZpcmViYXNlSWQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG15UHJvZmlsZSA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJykuc2V0dGluZ3M7XG4gICAgICAgIHZhciBwYXRoID0gJy91LycgKyBteVByb2ZpbGUuZmlyZWJhc2VVSUQgKyAnL3gnO1xuXG4gICAgICAgIC8vIGFkZCB0aGlzIHVzZXIgY29kZSAvIGZpcmViYXNlIElkIHRvIHRoZSBsaXN0IG9mIHBlb3BsZSB3aG8gY2FuIG1lc3NhZ2UgbWVcbiAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICBmaXJlYmFzZUlkXG4gICAgICAgICkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIG5vdGlmeSBmcmllbmQgd2l0aCBvdXIgb3duIGRldGFpbHNcbiAgICAgICAgICAgIGdldEZyaWVuZFB1YmxpY0tleShmaXJlYmFzZUlkKS50aGVuKHB1YmxpY0tleSA9PiB7XG5cbiAgICAgICAgICAgICAgICB2YXIgbXlEZXRhaWxzID0ge1xuICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogbXlQcm9maWxlLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZUlkOiBteVByb2ZpbGUuZmlyZWJhc2VVSURcbiAgICAgICAgICAgICAgICAgICAgLy8gYXZhdGFyOlxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIGVuY3J5cHRlZE15RGV0YWlscyA9IGVuY3J5cHQobXlEZXRhaWxzLCBwdWJsaWNLZXkpO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICAgICAgICAgJy9uLycsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFVzZXI6IGZpcmViYXNlSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBteURldGFpbHM6IGVuY3J5cHRlZE15RGV0YWlsc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZmlyZWJhc2VJZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgZnJpZW5kUmVmIGRvZXMgbm90IGV4aXN0LCBpbml0aWFsaXNlIHRlbXBvcmFyeSB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmcmllbmRSZWYpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBTZXQgcHJlbGltaW5hcnkgZGV0YWlscyBkZXRhaWxzIGZvciBmcmllbmRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdGcmllbmQgPSBuZXcgRnJpZW5kKCdQZW5kaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmQubGFzdE1lc3NhZ2VQcmV2aWV3ID0gJ1dhaXRpbmcgZm9yIGZyaWVuZCBjb25maXJtYXRpb24uLi4gKGNvZGU6ICcgKyBmaXJlYmFzZUlkICsgJyknO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQobmV3RnJpZW5kLCBmaXJlYmFzZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCdBZGRlZCBOZXcgRnJpZW5kJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUFkZEZyaWVuZE5vdGlmaWNhdGlvbihub3RpZmljYXRpb25JZCwgZW5jcnlwdGVkRnJpZW5kRGV0YWlscykge1xuXG4gICAgdmFyIGZyaWVuZCA9IGRlY3J5cHQoZW5jcnlwdGVkRnJpZW5kRGV0YWlscyk7XG5cbiAgICBsZXQgbG9jYWxGcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCk7XG5cbiAgICAvLyBpZiB3ZSBhbHJlYWR5IGhhdmUgYSByZWNvcmQgZm9yIHRoYXQgZnJpZW5kIChpLmUuIHRoZXkgZ2F2ZSB1cyB0aGUgY29kZSksIHVwZGF0ZSB0aGUgRnJpZW5kIHJlY29yZFxuICAgIGlmIChsb2NhbEZyaWVuZFJlZikge1xuXG4gICAgICAgIGxvY2FsRnJpZW5kUmVmLm5pY2tuYW1lID0gZnJpZW5kLm5pY2tuYW1lO1xuICAgICAgICBsb2NhbEZyaWVuZFJlZi5sYXN0TWVzc2FnZVByZXZpZXcgPSAnTmV3IEZyaWVuZCc7XG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGZyaWVuZC5maXJlYmFzZUlkLCBsb2NhbEZyaWVuZFJlZik7XG5cbiAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZENvbmZpcm1hdGlvbihmcmllbmQubmlja25hbWUpO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhIHJlY29yZCBmb3IgdGhhdCBmcmllbmQgKGkuZS4gd2UgZ2F2ZSB0aGVtIHRoZSBjb2RlKSwgcmVxdWVzdCBwZXJtaXNzaW9uIHRvIGFkZCB0aGVtIHRvIG91ciBmcmllbmRzIGxpc3RcbiAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZFJlcXVlc3QoZnJpZW5kLm5pY2tuYW1lKVxuICAgICAgICAgICAgLnRoZW4oY29uZmlybWF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICAvLyBpZiB3ZSByZWNlaXZlIGEgdHJ1ZSB2YWx1ZSAoPT0gYWNjZXB0KSBmcm9tIHRoZSBQcm9taXNlXG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpcm1hdGlvbikge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCBGcmllbmQgcmVjb3JkIHdpdGggaW5pdGlhbCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgYWRkRnJpZW5kKGZyaWVuZC5maXJlYmFzZUlkKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiB1cGRhdGUgd2l0aCB0aGUgYWN0dWFsIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvY2FsRnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxGcmllbmRSZWYubmlja25hbWUgPSBmcmllbmQubmlja25hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbEZyaWVuZFJlZi5sYXN0TWVzc2FnZVByZXZpZXcgPSAnTmV3IEZyaWVuZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCwgbG9jYWxGcmllbmRSZWYpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kQ29uZmlybWF0aW9uKGZyaWVuZC5uaWNrbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAvLyBnZXQgdGhlIHBhdGggdG8gdGhlIHBlcm1pc3Npb24gZW50cnkgdG8gcmVtb3ZlXG4gICAgICAgIHZhciBwZXJtaXNzaW9uUGF0aCA9ICcvdS8nICsgYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MuZmlyZWJhc2VVSUQgKyAnL3gvJ1xuICAgICAgICBmaXJlYmFzZS5xdWVyeShyZXN1bHQgPT4ge1xuXG4gICAgICAgICAgICAvLyBvbmx5IGdldCBleGNpdGVkIGlmIHdlIGFjdHVhbGx5IGZpbmQgdGhlIHBlcm1pc3Npb24gcmVjb3JkXG4gICAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IE9iamVjdC5rZXlzKHJlc3VsdC52YWx1ZSlbMF07ICAvLyA9PSB0aGUga2V5IHRvIHRoZSByZWNvcmQgdG8gcmVtb3ZlXG5cbiAgICAgICAgICAgICAgICAvLyBzZXQgdGhlIHRhcmdldCBwYXRoIHRvIG51bGxcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShwZXJtaXNzaW9uUGF0aCArIHRhcmdldCwgbnVsbCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiBkZWxldGUgdGhlIGxvY2FsIHJlY29yZCBhbmQgcmVzb2x2ZVxuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ1JlbW92ZWQgRnJpZW5kJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlLmRlbGV0ZURvY3VtZW50KHRhcmdldElkKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdGcmllbmQgZGlkIG5vdCBoYXZlIHBlcm1pc3Npb25zIHRvIG1lc3NhZ2UgeW91Jyk7ICAgICAgLy8gPT0gdGhlIGZpcmViYXNlIHJlY29yZCB3YXMgcHJldmlvdXNseSBkZWxldGVkIChzaG91bGQgbm90IGhhcHBlbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgICAgIHBlcm1pc3Npb25QYXRoLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNpbmdsZUV2ZW50OiB0cnVlLFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlyZWJhc2UuUXVlcnlPcmRlckJ5VHlwZS5WQUxVRSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciB1cGRhdGVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZERvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoY2hhdElkKTtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc3RvcmUgdGhlIG1lc3NhZ2UgaW4gbWVtb3J5ICBcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlQXV0aG9yID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5zZXR0aW5ncy5maXJlYmFzZVVJRDtcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnU2VuZGluZy4uLic7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlSW5kZXggPSBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcblxuICAgICAgICAvLyBwcmVwYXJlIG1lc3NhZ2UgZm9yIHNlbmRpbmdcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBtZXNzYWdlQXV0aG9yOiBuZXdNZXNzYWdlLm1lc3NhZ2VBdXRob3IsXG4gICAgICAgICAgICBtZXNzYWdlVGV4dDogbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCxcbiAgICAgICAgICAgIG1lc3NhZ2VUaW1lU2VudDogbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnRcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBnZXQgZW5jcnlwdGlvbiBrZXlcbiAgICAgICAgZ2V0RnJpZW5kUHVibGljS2V5KGNoYXRJZCkudGhlbihwdWJsaWNLZXkgPT4ge1xuXG4gICAgICAgICAgICB2YXIgZW5jcnlwdGVkTWVzc2FnZSA9IGVuY3J5cHQobWVzc2FnZSwgcHVibGljS2V5KTtcblxuICAgICAgICAgICAgLy8gcHVzaCBtZXNzYWdlIHRvIGZpcmViYXNlXG4gICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICcvdS8nICsgbmV3RnJpZW5kRG9jdW1lbnQuX2lkICsgJy96JyxcbiAgICAgICAgICAgICAgICBlbmNyeXB0ZWRNZXNzYWdlXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLy90aGVuIHVwZGF0ZSB0aGUgbG9jYWwgc3RhdGUgICAgXG4gICAgICAgICAgICAgICAgLnRoZW4oY29uZmlybWF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0ubWVzc2FnZVN0YXR1cyA9IFwiU2VudFwiO1xuICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5pZCA9IGNvbmZpcm1hdGlvbi5rZXk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCdNZXNzYWdlIFNlbnQnKTtcblxuICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0ubWVzc2FnZVN0YXR1cyA9IFwiRmFpbGVkXCI7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZXRyaWV2ZUFsbE1lc3NhZ2VzKCk6IFByb21pc2U8QXJyYXk8T2JqZWN0Pj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG15SWQgPSBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5maXJlYmFzZVVJRDtcbiAgICAgICAgdmFyIGV2ZW50TGlzdGVuZXJzO1xuICAgICAgICB2YXIgbXlNZXNzYWdlc1BhdGggPSAnL3UvJyArIG15SWQgKyAnL3onO1xuXG4gICAgICAgIGZpcmViYXNlLmFkZFZhbHVlRXZlbnRMaXN0ZW5lcihzbmFwc2hvdCA9PiB7XG5cbiAgICAgICAgICAgIC8vIG9ubHkgZ2V0IGV4Y2l0ZWQgd2hlbiB0aGluZ3MgYXJlIEFkZGVkIHRvIHRoZSBQYXRoLCBub3QgYWxzbyBvbiB0aGUgUmVtb3ZlIGV2ZW50IHdoaWNoIGlzIHRyaWdnZXJlZCBsYXRlci5cbiAgICAgICAgICAgIGlmIChzbmFwc2hvdC52YWx1ZSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2VzQXJyYXkgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIga2V5c0FycmF5ID0gT2JqZWN0LmtleXMoc25hcHNob3QudmFsdWUpO1xuICAgICAgICAgICAgICAgIGtleXNBcnJheS5mb3JFYWNoKGtleSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlY3J5cHRlZE1lc3NhZ2UgPSBkZWNyeXB0KHNuYXBzaG90LnZhbHVlW2tleV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBuZXcgTWVzc2FnZSgpIGZvciBsb2NhbCBjb25zdW1wdGlvblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3TWVzc2FnZSA9IG5ldyBNZXNzYWdlKCcnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UuaWQgPSBrZXk7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZUF1dGhvciA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZUF1dGhvcjtcbiAgICAgICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRpbWVTZW50ID0gbmV3IERhdGUoZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlVGltZVNlbnQpO1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnUmVjZWl2ZWQnO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhdmUgdGhpcyBtZXNzYWdlIHRvIHJldHVybiB0byB0aGUgbm90aWZpY2F0aW9uIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXNBcnJheS5wdXNoKG5ld01lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB1cGRhdGVkIEZyaWVuZCBSZWNvcmRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldEZyaWVuZCA9IGdldEZyaWVuZChkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VBdXRob3IpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQudGltZUxhc3RNZXNzYWdlID0gbmV3TWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQubGFzdE1lc3NhZ2VQcmV2aWV3ID0gZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnVucmVhZE1lc3NhZ2VzTnVtYmVyICs9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlbiBzb3J0IHRoZSBtZXNzYWdlcy4gZm9yIHNvcnRpbmcgYXJyYXlzLCBzZWU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L3NvcnRcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLm1lc3NhZ2VzID0gdGFyZ2V0RnJpZW5kLm1lc3NhZ2VzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRlQSA9IG5ldyBEYXRlKGEubWVzc2FnZVRpbWVTZW50KS52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0ZUIgPSBuZXcgRGF0ZShiLm1lc3NhZ2VUaW1lU2VudCkudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVBIC0gZGF0ZUI7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgZGF0YWJhc2VcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlQXV0aG9yLCB0YXJnZXRGcmllbmQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBzZW5kZXIgb2YgcmVjZWlwdFxuICAgICAgICAgICAgICAgICAgICBjb25maXJtTWVzc2FnZVJlY2VpcHQobXlJZCwgZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlQXV0aG9yLCBuZXdNZXNzYWdlLmlkLCBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZXZlbnRMaXN0ZW5lcnMsIG15TWVzc2FnZXNQYXRoKTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShteU1lc3NhZ2VzUGF0aCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlc0FycmF5KTtcblxuICAgICAgICAgICAgfSBlbHNlIHJlamVjdCgnQ291bGQgbm90IGZpbmQgYW55IG1lc3NhZ2Ugb24gRmlyZWJhc2UnKTtcblxuICAgICAgICB9LCBteU1lc3NhZ2VzUGF0aCkudGhlbihsaXN0ZW5lcldyYXBwZXIgPT4ge1xuXG4gICAgICAgICAgICAvLyBnZXQgZXZlbnRMaXN0ZW5lcnMgcmVmXG4gICAgICAgICAgICBldmVudExpc3RlbmVycyA9IGxpc3RlbmVyV3JhcHBlci5saXN0ZW5lcnM7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjb25maXJtTWVzc2FnZVJlY2VpcHQobXlJZCwgYXV0aG9yLCBtZXNzYWdlSWQsIHRpbWVSZWNlaXZlZCkge1xuICAgIHZhciBub3RpZmljYXRpb25QYXRoID0gJy9jLycgKyBhdXRob3I7XG4gICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgIGlkOiBtZXNzYWdlSWQsXG4gICAgICAgIHNlbmRlcjogbXlJZCxcbiAgICAgICAgdGltZVJlY2VpdmVkOiB0aW1lUmVjZWl2ZWRcbiAgICB9O1xuXG4gICAgZ2V0RnJpZW5kUHVibGljS2V5KGF1dGhvcikudGhlbihwdWJsaWNLZXkgPT4ge1xuICAgICAgICB2YXIgZW5jcnlwdGVkUGF5bG9hZCA9IGVuY3J5cHQocGF5bG9hZCwgcHVibGljS2V5KTtcbiAgICAgICAgZmlyZWJhc2UucHVzaChub3RpZmljYXRpb25QYXRoLCBlbmNyeXB0ZWRQYXlsb2FkKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlTWVzc2FnZVJlY2VpcHROb3RpZmljYXRpb24oZW5jcnlwdGVkTm90aWZpY2F0aW9uKTogUHJvbWlzZTx7IGNoYXRJZDogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgbm90aWZpY2F0aW9uID0gZGVjcnlwdChlbmNyeXB0ZWROb3RpZmljYXRpb24pO1xuICAgICAgICB2YXIgZnJpZW5kID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQobm90aWZpY2F0aW9uLnNlbmRlcik7XG5cbiAgICAgICAgZnJpZW5kLm1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiB7XG4gICAgICAgICAgICBpZiAobm90aWZpY2F0aW9uLmlkID09PSBtZXNzYWdlLmlkKSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5tZXNzYWdlU3RhdHVzID0gJ1JlY2VpdmVkJztcbiAgICAgICAgICAgICAgICBtZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQgPSBub3RpZmljYXRpb24udGltZVJlY2VpdmVkO1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KG5vdGlmaWNhdGlvbi5zZW5kZXIsIGZyaWVuZCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShub3RpZmljYXRpb24uc2VuZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblxuLy8gQ3J5cHRvIGFuZCB1dGlsaXR5IGZ1bmN0aW9uc1xuXG5mdW5jdGlvbiBlbmNyeXB0KHBheWxvYWQ6IE9iamVjdCwga2V5OiBzdHJpbmcpIHtcblxuICAgIHZhciBlbmNyeXB0aW9uS2V5ID0gZm9yZ2UucGtpLnB1YmxpY0tleUZyb21QZW0oa2V5KTtcbiAgICB2YXIgcHJlUHJvY2Vzc2VkUGF5bG9hZCA9IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpO1xuICAgIHZhciBlbmNyeXB0ZWRQYXlsb2FkID0gJyc7XG5cbiAgICAvLyBoYW5kbGUgbWVzc2FnZXMgbG9uZ2VyIHRoYW4gdGhlIDRCIGtleSAgICBcbiAgICB3aGlsZSAocHJlUHJvY2Vzc2VkUGF5bG9hZCkge1xuICAgICAgICBlbmNyeXB0ZWRQYXlsb2FkICs9IGVuY3J5cHRpb25LZXkuZW5jcnlwdChwcmVQcm9jZXNzZWRQYXlsb2FkLnNsaWNlKDAsIDUwMSkpOyAgICAgICAvLyBiZWNhdXNlIHRoZSBrZXkgaXMgNCBLYml0cyBhbmQgcGFkZGluZyBpcyAxMSBCeXRlc1xuICAgICAgICBwcmVQcm9jZXNzZWRQYXlsb2FkID0gcHJlUHJvY2Vzc2VkUGF5bG9hZC5zdWJzdHIoNTAxLCBwcmVQcm9jZXNzZWRQYXlsb2FkLmxlbmd0aCAtIDEpO1xuICAgIH1cblxuICAgIHJldHVybiBlbmNyeXB0ZWRQYXlsb2FkO1xufVxuXG5mdW5jdGlvbiBkZWNyeXB0KHBheWxvYWQ6IHN0cmluZykge1xuXG4gICAgdmFyIGRlY3J5cHRpb25LZXkgPSBmb3JnZS5wa2kucHJpdmF0ZUtleUZyb21QZW0oYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucHJpdmF0ZUtleSk7XG4gICAgdmFyIGRlY3J5cHRlZFBheWxvYWRTdHJpbmcgPSAnJztcblxuICAgIC8vIGhhbmRsZSBtZXNzYWdlcyBsb25nZXIgdGhhbiB0aGUgNEIga2V5XG4gICAgd2hpbGUgKHBheWxvYWQpIHtcbiAgICAgICAgZGVjcnlwdGVkUGF5bG9hZFN0cmluZyArPSBkZWNyeXB0aW9uS2V5LmRlY3J5cHQocGF5bG9hZC5zdWJzdHIoMCwgNTEyKSk7XG4gICAgICAgIHBheWxvYWQgPSBwYXlsb2FkLnN1YnN0cig1MTIsIHBheWxvYWQubGVuZ3RoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gSlNPTi5wYXJzZShkZWNyeXB0ZWRQYXlsb2FkU3RyaW5nKTtcbn1cblxuZnVuY3Rpb24gZ2V0UmFuZG9taXNoU3RyaW5nKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcbn0iXX0=