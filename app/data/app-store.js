"use strict";
var firebase = require("nativescript-plugin-firebase");
var nativescript_couchbase_1 = require("nativescript-couchbase");
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
            database.deleteDocument('squeak-app');
            _this.firebaseInit().then(function (firebaseMessagingToken) {
                var randomEmail = getRandomishString() + '@' + getRandomishString() + '.com';
                var randomPassword = getRandomishString() + getRandomishString();
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
    };
    AppData.prototype.updateFirebaseRecords = function (user) {
        return new Promise(function (resolve, reject) {
            firebase.setValue('/users/' + user.userUID, {
                k: '',
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
exports.getFriendsList = function () {
    return new Promise(function (resolve, reject) {
        var friendsListQuery = database.executeQuery('friends');
        if (friendsListQuery) {
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
        var path = '/users/' + myProfile.firebaseUID + '/x';
        // add this user code / firebase Id to the list of people who can message me
        firebase.push(path, firebaseId).then(function () {
            // notify friend with our own details
            var encryptedMyDetails = JSON.stringify({
                // to be encrypted
                nickname: myProfile.nickname,
                firebaseId: myProfile.firebaseUID
            });
            firebase.push('notifications', {
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
};
function handleAddFriendNotification(notificationId, encryptedFriendDetails) {
    var friend = JSON.parse(encryptedFriendDetails);
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
        database.deleteDocument(targetId);
        resolve('Removed Friend');
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
        var encryptedMessage = JSON.stringify({
            messageAuthor: newMessage.messageAuthor,
            messageText: newMessage.messageText,
            messageTimeSent: newMessage.messageTimeSent
        });
        // push message to firebase
        firebase.push('/users/' + newFriendDocument._id + '/z', encryptedMessage)
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
    });
};
function retrieveAllMessages() {
    return new Promise(function (resolve, reject) {
        var myId = appDocumentRef.settings.firebaseUID;
        var eventListeners;
        var myMessagesPath = 'users/' + myId + '/z';
        firebase.addValueEventListener(function (snapshot) {
            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.
            if (snapshot.value) {
                var messagesArray = [];
                var keysArray = Object.keys(snapshot.value);
                keysArray.forEach(function (key) {
                    var decryptedMessage = JSON.parse(snapshot.value[key]);
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
    var notificationPath = 'confirmations/' + author;
    var encryptedPayload = JSON.stringify({
        id: messageId,
        sender: myId,
        timeReceived: timeReceived
    });
    firebase.push(notificationPath, encryptedPayload);
}
function handleMessageReceiptNotification(encryptedNotification) {
    return new Promise(function (resolve, reject) {
        var notification = JSON.parse(encryptedNotification);
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
// Random utility functions
function getRandomishString() {
    return Math.random().toString(36).slice(2);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUNuRCxvREFBc0Q7QUFFdEQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRWhELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSEQsd0VBR0M7QUFFRDtJQUFBO1FBRVksaUJBQVksR0FBRztZQUNu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Q0FBQyxDQUFDO1lBQ2pDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUdELDJCQUEyQjtBQUUzQjtJQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZmlyZWJhc2UgZnJvbSAnbmF0aXZlc2NyaXB0LXBsdWdpbi1maXJlYmFzZSc7XG5pbXBvcnQgeyBDb3VjaGJhc2UgfSBmcm9tICduYXRpdmVzY3JpcHQtY291Y2hiYXNlJztcblxuaW1wb3J0IHsgRnJpZW5kLCBNZXNzYWdlIH0gZnJvbSAnLi9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgKiBhcyBub3RpZmljYXRpb25TZXJ2aWNlIGZyb20gJy4vbm90aWZpY2F0aW9uJztcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEFQSTpcbi8vIFxuLy8gaW5pdEZyaWVuZHNEYXRhKCkudGhlbig8ZG8gc3R1ZmY+KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGluaXRhbGlzZXMgdGhlIERhdGFiYXNlIGFuZCB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBnZXRGcmllbmRzTGlzdCgpLnRoZW4oIGZyaWVuZHNMaXN0ID0+IHsgPGRvIHN0dWZmIHdpdGggZnJpZW5kc0xpc3QgQXJyYXk+IH0gKSAgICAgICAgLS0gZ2V0cyB0aGUgZnJpZW5kc0xpc3QgYXMgYW4gQXJyYXlcbi8vIGFkZEZyaWVuZCg8ZnJpZW5kIG5pY2tuYW1lPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHJlbW92ZUZyaWVuZCg8ZnJpZW5kIF9pZD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHVwZGF0ZUZyaWVuZCg8ZnJpZW5kIF9pZD4sIDxuZXcgZGF0YSBjb250ZW50PikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBDb3VjaGJhc2UgaW5pdGlhbCBjb25maWd1cmF0aW9uXG5jb25zdCBEQl9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ2NvdWNoYmFzZS5kYicsXG59XG52YXIgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcblxuLy8gUHJlLWRlZmluZSBRdWVyaWVzXG5kYXRhYmFzZS5jcmVhdGVWaWV3KCdmcmllbmRzJywgJzEnLCAoZG9jdW1lbnQsIGVtaXR0ZXIpID0+IHtcbiAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRUeXBlID09PSAnRnJpZW5kJykge1xuICAgICAgICBlbWl0dGVyLmVtaXQoZG9jdW1lbnQudGltZUxhc3RNZXNzYWdlLCBkb2N1bWVudCk7ICAgICAvLyBjYWxsIGJhY2sgd2l0aCB0aGlzIGRvY3VtZW50O1xuICAgIH07XG59KTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBVdGlsaXR5IGZ1bmN0aW9ucyBleHBvc2VkIHRvIGFsbCBvdGhlciBWaWV3cywgd2hpY2ggYWJzdHJhY3QgYXdheSBjb21wbGV0ZWx5IGZyb20gdGhlIERCIGJhY2tlbmQuIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gR2VuZXJhbCBBcHAgZGV0YWlscyBkYXRhIGFuZCBEYXRhYmFzZSBpbml0YWxpc2F0aW9uXG5cbnZhciBhcHBEb2N1bWVudFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FwcERhdGFBbHJlYWR5SW5pdGlhbGlzZWQoKTogQm9vbGVhbiB7XG4gICAgaWYgKGFwcERvY3VtZW50UmVmKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBEYXRhIHtcblxuICAgIHByaXZhdGUgZmlyZWJhc2VJbml0ID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyB0b2tlbjogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZpcmViYXNlLmluaXQoe1xuXG4gICAgICAgICAgICAgICAgb25NZXNzYWdlUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKG5vdGlmaWNhdGlvbjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubWVzc2FnZVRvRmV0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHJpZXZlQWxsTWVzc2FnZXMoKS50aGVuKG1lc3NhZ2VzQXJyYXkgPT4gbm90aWZpY2F0aW9uU2VydmljZS5hbGVydE5ld01lc3NhZ2VzKG1lc3NhZ2VzQXJyYXkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubXlEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVBZGRGcmllbmROb3RpZmljYXRpb24obm90aWZpY2F0aW9uLm5vdGlmaWNhdGlvbklkLCBub3RpZmljYXRpb24ubXlEZXRhaWxzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlTWVzc2FnZVJlY2VpcHROb3RpZmljYXRpb24obm90aWZpY2F0aW9uLm0pLnRoZW4oY2hhdElkID0+IG5vdGlmaWNhdGlvblNlcnZpY2UucmVmcmVzaE1lc3NhZ2VTdGF0dXMoY2hhdElkKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgb25QdXNoVG9rZW5SZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0QXBwRGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuICAgICAgICAgICAgICAgIGZpcmViYXNlLmxvZ2luKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlyZWJhc2UuTG9naW5UeXBlLlBBU1NXT1JELFxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5wYXNzd29yZFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHVzZXIgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvcjogJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIEluaXRpYWxpc2VkIScpOyAgICAgICAgICAgLy8gZG8gbm90IHdhaXQgZm9yIGZpcmViYXNlIC0gdXNlciBzaG91bGQgYmUgYWJsZSB0byBzZWUgbG9jYWwgZGF0YVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdlbmVyYXRlUmFuZG9tRmlyZWJhc2VVc2VyKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgICAgICB0aGlzLmZpcmViYXNlSW5pdCgpLnRoZW4oZmlyZWJhc2VNZXNzYWdpbmdUb2tlbiA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbUVtYWlsID0gZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnQCcgKyBnZXRSYW5kb21pc2hTdHJpbmcoKSArICcuY29tJztcbiAgICAgICAgICAgICAgICB2YXIgcmFuZG9tUGFzc3dvcmQgPSBnZXRSYW5kb21pc2hTdHJpbmcoKSArIGdldFJhbmRvbWlzaFN0cmluZygpO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UuY3JlYXRlVXNlcih7XG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkXG4gICAgICAgICAgICAgICAgfSkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZVVJRDogdXNlci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogcmFuZG9tRW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogcmFuZG9tUGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuOiBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byByZWdpc3RlciBBbm9ueW1vdXMgaWRlbnRpdHkgb24gcmVtb3RlIHNlcnZlcnMgJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2F2ZVJhbmRvbVVzZXJMb2NhbGx5KHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KHtcbiAgICAgICAgICAgICAgICBhcHBOYW1lOiAnU3F1ZWFrJyxcbiAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICBhdmF0YXJQYXRoOiAnfi9pbWFnZXMvYXZhdGFyLnBuZycsXG4gICAgICAgICAgICAgICAgICAgIG5pY2tuYW1lOiAnU3F1ZWFrJyxcbiAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2VVSUQ6IHVzZXIuZmlyZWJhc2VVSUQsXG4gICAgICAgICAgICAgICAgICAgIGZjbU1lc3NhZ2luZ1Rva2VuOiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW4sXG4gICAgICAgICAgICAgICAgICAgIHJhbmRvbUlkZW50aXR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB1c2VyLnBhc3N3b3JkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAnc3F1ZWFrLWFwcCcpO1xuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgdXNlclVJRDogdXNlci5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuOiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlRmlyZWJhc2VSZWNvcmRzKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZpcmViYXNlLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICcvdXNlcnMvJyArIHVzZXIudXNlclVJRCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGs6ICcnLFxuICAgICAgICAgICAgICAgICAgICB0OiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW4sXG4gICAgICAgICAgICAgICAgICAgIHg6IFtdLFxuICAgICAgICAgICAgICAgICAgICB6OiBbXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIERhdGEgaW5pdGlhbGlzZWQuJyk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byBzZXQgVXNlciBkZXRhaWxzIG9uIHJlbW90ZSBzZXJ2ZXJzICcgKyBlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5cbi8vIExvY2FsIGFjY291bnQgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBmZXRjaExvY2FsQWNjb3VudERldGFpbHMoKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVMb2NhbE5pY2tuYW1lKG5pY2tuYW1lKSB7XG4gICAgdmFyIGxvY2FsU2V0dGluZ3NEb2N1bWVudCA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG4gICAgbG9jYWxTZXR0aW5nc0RvY3VtZW50LnNldHRpbmdzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoJ3NxdWVhay1hcHAnLCBsb2NhbFNldHRpbmdzRG9jdW1lbnQpO1xufVxuXG5cbi8vIEZyaWVuZHMgTGlzdCByZWxhdGVkIGRhdGFcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZyaWVuZChmcmllbmRJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KGZyaWVuZElkKTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIGZyaWVuZHNMaXN0UXVlcnkgPSBkYXRhYmFzZS5leGVjdXRlUXVlcnkoJ2ZyaWVuZHMnKTtcbiAgICAgICAgaWYgKGZyaWVuZHNMaXN0UXVlcnkpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZnJpZW5kc0xpc3RRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoJ0NvdWxkIG5vdCBvYnRhaW4gTGlzdCBvZiBGcmllbmRzIGZyb20gRGF0YWJhc2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChmaXJlYmFzZUlkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBteVByb2ZpbGUgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpLnNldHRpbmdzO1xuICAgICAgICB2YXIgcGF0aCA9ICcvdXNlcnMvJyArIG15UHJvZmlsZS5maXJlYmFzZVVJRCArICcveCc7XG5cbiAgICAgICAgLy8gYWRkIHRoaXMgdXNlciBjb2RlIC8gZmlyZWJhc2UgSWQgdG8gdGhlIGxpc3Qgb2YgcGVvcGxlIHdobyBjYW4gbWVzc2FnZSBtZVxuICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgIGZpcmViYXNlSWRcbiAgICAgICAgKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgLy8gbm90aWZ5IGZyaWVuZCB3aXRoIG91ciBvd24gZGV0YWlsc1xuICAgICAgICAgICAgdmFyIGVuY3J5cHRlZE15RGV0YWlscyA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAvLyB0byBiZSBlbmNyeXB0ZWRcbiAgICAgICAgICAgICAgICBuaWNrbmFtZTogbXlQcm9maWxlLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgIGZpcmViYXNlSWQ6IG15UHJvZmlsZS5maXJlYmFzZVVJRFxuICAgICAgICAgICAgICAgIC8vIGF2YXRhcjpcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICdub3RpZmljYXRpb25zJyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFVzZXI6IGZpcmViYXNlSWQsXG4gICAgICAgICAgICAgICAgICAgIG15RGV0YWlsczogZW5jcnlwdGVkTXlEZXRhaWxzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIHZhciBmcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmaXJlYmFzZUlkKTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGZyaWVuZFJlZiBkb2VzIG5vdCBleGlzdCwgaW5pdGlhbGlzZSB0ZW1wb3JhcnkgdmFsdWVzXG4gICAgICAgICAgICAgICAgaWYgKCFmcmllbmRSZWYpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyAgIFNldCBwcmVsaW1pbmFyeSBkZXRhaWxzIGRldGFpbHMgZm9yIGZyaWVuZFxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RnJpZW5kID0gbmV3IEZyaWVuZCgnUGVuZGluZycpO1xuICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmQubGFzdE1lc3NhZ2VQcmV2aWV3ID0gJ1dhaXRpbmcgZm9yIGZyaWVuZCBjb25maXJtYXRpb24uLi4gKGNvZGU6ICcgKyBmaXJlYmFzZUlkICsgJyknO1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudChuZXdGcmllbmQsIGZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKCdBZGRlZCBOZXcgRnJpZW5kJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUFkZEZyaWVuZE5vdGlmaWNhdGlvbihub3RpZmljYXRpb25JZCwgZW5jcnlwdGVkRnJpZW5kRGV0YWlscykge1xuXG4gICAgdmFyIGZyaWVuZCA9IEpTT04ucGFyc2UoZW5jcnlwdGVkRnJpZW5kRGV0YWlscyk7XG5cbiAgICBsZXQgbG9jYWxGcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCk7XG5cbiAgICAvLyBpZiB3ZSBhbHJlYWR5IGhhdmUgYSByZWNvcmQgZm9yIHRoYXQgZnJpZW5kIChpLmUuIHRoZXkgZ2F2ZSB1cyB0aGUgY29kZSksIHVwZGF0ZSB0aGUgRnJpZW5kIHJlY29yZFxuICAgIGlmIChsb2NhbEZyaWVuZFJlZikge1xuXG4gICAgICAgIGxvY2FsRnJpZW5kUmVmLm5pY2tuYW1lID0gZnJpZW5kLm5pY2tuYW1lO1xuICAgICAgICBsb2NhbEZyaWVuZFJlZi5sYXN0TWVzc2FnZVByZXZpZXcgPSAnTmV3IEZyaWVuZCc7XG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGZyaWVuZC5maXJlYmFzZUlkLCBsb2NhbEZyaWVuZFJlZik7XG5cbiAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZENvbmZpcm1hdGlvbihmcmllbmQubmlja25hbWUpO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhIHJlY29yZCBmb3IgdGhhdCBmcmllbmQgKGkuZS4gd2UgZ2F2ZSB0aGVtIHRoZSBjb2RlKSwgcmVxdWVzdCBwZXJtaXNzaW9uIHRvIGFkZCB0aGVtIHRvIG91ciBmcmllbmRzIGxpc3RcbiAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZFJlcXVlc3QoZnJpZW5kLm5pY2tuYW1lKVxuICAgICAgICAgICAgLnRoZW4oY29uZmlybWF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICAvLyBpZiB3ZSByZWNlaXZlIGEgdHJ1ZSB2YWx1ZSAoPT0gYWNjZXB0KSBmcm9tIHRoZSBQcm9taXNlXG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpcm1hdGlvbikge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCBGcmllbmQgcmVjb3JkIHdpdGggaW5pdGlhbCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgYWRkRnJpZW5kKGZyaWVuZC5maXJlYmFzZUlkKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiB1cGRhdGUgd2l0aCB0aGUgYWN0dWFsIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvY2FsRnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxGcmllbmRSZWYubmlja25hbWUgPSBmcmllbmQubmlja25hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbEZyaWVuZFJlZi5sYXN0TWVzc2FnZVByZXZpZXcgPSAnTmV3IEZyaWVuZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCwgbG9jYWxGcmllbmRSZWYpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kQ29uZmlybWF0aW9uKGZyaWVuZC5uaWNrbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnUmVtb3ZlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciB1cGRhdGVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZERvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoY2hhdElkKTtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc3RvcmUgdGhlIG1lc3NhZ2UgaW4gbWVtb3J5ICBcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlQXV0aG9yID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5zZXR0aW5ncy5maXJlYmFzZVVJRDtcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnU2VuZGluZy4uLic7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlSW5kZXggPSBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcblxuICAgICAgICAvLyBwcmVwYXJlIG1lc3NhZ2UgZm9yIHNlbmRpbmdcbiAgICAgICAgdmFyIGVuY3J5cHRlZE1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBtZXNzYWdlQXV0aG9yOiBuZXdNZXNzYWdlLm1lc3NhZ2VBdXRob3IsXG4gICAgICAgICAgICBtZXNzYWdlVGV4dDogbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCxcbiAgICAgICAgICAgIG1lc3NhZ2VUaW1lU2VudDogbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcHVzaCBtZXNzYWdlIHRvIGZpcmViYXNlXG4gICAgICAgIGZpcmViYXNlLnB1c2goXG4gICAgICAgICAgICAnL3VzZXJzLycgKyBuZXdGcmllbmREb2N1bWVudC5faWQgKyAnL3onLFxuICAgICAgICAgICAgZW5jcnlwdGVkTWVzc2FnZVxuICAgICAgICApXG4gICAgICAgICAgICAvL3RoZW4gdXBkYXRlIHRoZSBsb2NhbCBzdGF0ZSAgICBcbiAgICAgICAgICAgIC50aGVuKGNvbmZpcm1hdGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0ubWVzc2FnZVN0YXR1cyA9IFwiU2VudFwiO1xuICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLmlkID0gY29uZmlybWF0aW9uLmtleTtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdNZXNzYWdlIFNlbnQnKTtcblxuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZXRyaWV2ZUFsbE1lc3NhZ2VzKCk6IFByb21pc2U8QXJyYXk8T2JqZWN0Pj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG15SWQgPSBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5maXJlYmFzZVVJRDtcbiAgICAgICAgdmFyIGV2ZW50TGlzdGVuZXJzO1xuICAgICAgICB2YXIgbXlNZXNzYWdlc1BhdGggPSAndXNlcnMvJyArIG15SWQgKyAnL3onO1xuXG4gICAgICAgIGZpcmViYXNlLmFkZFZhbHVlRXZlbnRMaXN0ZW5lcihzbmFwc2hvdCA9PiB7XG5cbiAgICAgICAgICAgIC8vIG9ubHkgZ2V0IGV4Y2l0ZWQgd2hlbiB0aGluZ3MgYXJlIEFkZGVkIHRvIHRoZSBQYXRoLCBub3QgYWxzbyBvbiB0aGUgUmVtb3ZlIGV2ZW50IHdoaWNoIGlzIHRyaWdnZXJlZCBsYXRlci5cbiAgICAgICAgICAgIGlmIChzbmFwc2hvdC52YWx1ZSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2VzQXJyYXkgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIga2V5c0FycmF5ID0gT2JqZWN0LmtleXMoc25hcHNob3QudmFsdWUpO1xuICAgICAgICAgICAgICAgIGtleXNBcnJheS5mb3JFYWNoKGtleSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlY3J5cHRlZE1lc3NhZ2UgPSBKU09OLnBhcnNlKHNuYXBzaG90LnZhbHVlW2tleV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBuZXcgTWVzc2FnZSgpIGZvciBsb2NhbCBjb25zdW1wdGlvblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3TWVzc2FnZSA9IG5ldyBNZXNzYWdlKCcnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UuaWQgPSBrZXk7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZUF1dGhvciA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZUF1dGhvcjtcbiAgICAgICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRpbWVTZW50ID0gbmV3IERhdGUoZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlVGltZVNlbnQpO1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnUmVjZWl2ZWQnO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhdmUgdGhpcyBtZXNzYWdlIHRvIHJldHVybiB0byB0aGUgbm90aWZpY2F0aW9uIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXNBcnJheS5wdXNoKG5ld01lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB1cGRhdGVkIEZyaWVuZCBSZWNvcmRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldEZyaWVuZCA9IGdldEZyaWVuZChkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VBdXRob3IpO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQubWVzc2FnZXMucHVzaChuZXdNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnRpbWVMYXN0TWVzc2FnZSA9IG5ld01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLmxhc3RNZXNzYWdlUHJldmlldyA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC51bnJlYWRNZXNzYWdlc051bWJlciArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgZGF0YWJhc2VcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlQXV0aG9yLCB0YXJnZXRGcmllbmQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBzZW5kZXIgb2YgcmVjZWlwdFxuICAgICAgICAgICAgICAgICAgICBjb25maXJtTWVzc2FnZVJlY2VpcHQobXlJZCwgZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlQXV0aG9yLCBuZXdNZXNzYWdlLmlkLCBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZXZlbnRMaXN0ZW5lcnMsIG15TWVzc2FnZXNQYXRoKTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShteU1lc3NhZ2VzUGF0aCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlc0FycmF5KTtcblxuICAgICAgICAgICAgfSBlbHNlIHJlamVjdCgnQ291bGQgbm90IGZpbmQgYW55IG1lc3NhZ2Ugb24gRmlyZWJhc2UnKTtcblxuICAgICAgICB9LCBteU1lc3NhZ2VzUGF0aCkudGhlbihsaXN0ZW5lcldyYXBwZXIgPT4ge1xuXG4gICAgICAgICAgICAvLyBnZXQgZXZlbnRMaXN0ZW5lcnMgcmVmXG4gICAgICAgICAgICBldmVudExpc3RlbmVycyA9IGxpc3RlbmVyV3JhcHBlci5saXN0ZW5lcnM7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjb25maXJtTWVzc2FnZVJlY2VpcHQobXlJZCwgYXV0aG9yLCBtZXNzYWdlSWQsIHRpbWVSZWNlaXZlZCkge1xuICAgIHZhciBub3RpZmljYXRpb25QYXRoID0gJ2NvbmZpcm1hdGlvbnMvJyArIGF1dGhvcjtcbiAgICB2YXIgZW5jcnlwdGVkUGF5bG9hZCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgaWQ6IG1lc3NhZ2VJZCxcbiAgICAgICAgc2VuZGVyOiBteUlkLFxuICAgICAgICB0aW1lUmVjZWl2ZWQ6IHRpbWVSZWNlaXZlZFxuICAgIH0pO1xuICAgIGZpcmViYXNlLnB1c2gobm90aWZpY2F0aW9uUGF0aCwgZW5jcnlwdGVkUGF5bG9hZCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2VSZWNlaXB0Tm90aWZpY2F0aW9uKGVuY3J5cHRlZE5vdGlmaWNhdGlvbik6IFByb21pc2U8eyBjaGF0SWQ6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5vdGlmaWNhdGlvbiA9IEpTT04ucGFyc2UoZW5jcnlwdGVkTm90aWZpY2F0aW9uKTtcbiAgICAgICAgdmFyIGZyaWVuZCA9IGRhdGFiYXNlLmdldERvY3VtZW50KG5vdGlmaWNhdGlvbi5zZW5kZXIpO1xuXG4gICAgICAgIGZyaWVuZC5tZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgICAgICAgaWYgKG5vdGlmaWNhdGlvbi5pZCA9PT0gbWVzc2FnZS5pZCkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UubWVzc2FnZVN0YXR1cyA9ICdSZWNlaXZlZCc7XG4gICAgICAgICAgICAgICAgbWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkID0gbm90aWZpY2F0aW9uLnRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChub3RpZmljYXRpb24uc2VuZGVyLCBmcmllbmQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUobm90aWZpY2F0aW9uLnNlbmRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIFJhbmRvbSB1dGlsaXR5IGZ1bmN0aW9uc1xuXG5mdW5jdGlvbiBnZXRSYW5kb21pc2hTdHJpbmcoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xufSJdfQ==