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
            .then(function () {
            newFriendDocument.messages[newMessageIndex - 1].messageStatus = "Sent";
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
                    newMessage.messageAuthor = decryptedMessage.messageAuthor;
                    newMessage.messageText = decryptedMessage.messageText;
                    newMessage.messageTimeSent = new Date(decryptedMessage.messageTimeSent);
                    newMessage.messageTimeReceived = new Date();
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
// Random utility functions
function getRandomishString() {
    return Math.random().toString(36).slice(2);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUNuRCxvREFBc0Q7QUFFdEQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRWhELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSEQsd0VBR0M7QUFFRDtJQUFBO1FBRVksaUJBQVksR0FBRztZQUNu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LEdBQUcsVUFBVSxDQUFDLG1CQUFtQixDQUFDO29CQUM5RCxZQUFZLENBQUMsa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDO29CQUMvRCxZQUFZLENBQUMsb0JBQW9CLElBQUksQ0FBQyxDQUFDO29CQUV2QyxzQkFBc0I7b0JBQ3RCLFFBQVEsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUMxRSxDQUFDLENBQUMsQ0FBQztnQkFFSCxRQUFRLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUM5RCxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDeEMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRTNCLENBQUM7WUFBQyxJQUFJO2dCQUFDLE1BQU0sQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBRTVELENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxlQUFlO1lBRW5DLHlCQUF5QjtZQUN6QixjQUFjLEdBQUcsZUFBZSxDQUFDLFNBQVMsQ0FBQztRQUMvQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUdELDJCQUEyQjtBQUUzQjtJQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZmlyZWJhc2UgZnJvbSAnbmF0aXZlc2NyaXB0LXBsdWdpbi1maXJlYmFzZSc7XG5pbXBvcnQgeyBDb3VjaGJhc2UgfSBmcm9tICduYXRpdmVzY3JpcHQtY291Y2hiYXNlJztcblxuaW1wb3J0IHsgRnJpZW5kLCBNZXNzYWdlIH0gZnJvbSAnLi9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgKiBhcyBub3RpZmljYXRpb25TZXJ2aWNlIGZyb20gJy4vbm90aWZpY2F0aW9uJztcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEFQSTpcbi8vIFxuLy8gaW5pdEZyaWVuZHNEYXRhKCkudGhlbig8ZG8gc3R1ZmY+KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGluaXRhbGlzZXMgdGhlIERhdGFiYXNlIGFuZCB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBnZXRGcmllbmRzTGlzdCgpLnRoZW4oIGZyaWVuZHNMaXN0ID0+IHsgPGRvIHN0dWZmIHdpdGggZnJpZW5kc0xpc3QgQXJyYXk+IH0gKSAgICAgICAgLS0gZ2V0cyB0aGUgZnJpZW5kc0xpc3QgYXMgYW4gQXJyYXlcbi8vIGFkZEZyaWVuZCg8ZnJpZW5kIG5pY2tuYW1lPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHJlbW92ZUZyaWVuZCg8ZnJpZW5kIF9pZD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHVwZGF0ZUZyaWVuZCg8ZnJpZW5kIF9pZD4sIDxuZXcgZGF0YSBjb250ZW50PikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBDb3VjaGJhc2UgaW5pdGlhbCBjb25maWd1cmF0aW9uXG5jb25zdCBEQl9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ2NvdWNoYmFzZS5kYicsXG59XG52YXIgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcblxuLy8gUHJlLWRlZmluZSBRdWVyaWVzXG5kYXRhYmFzZS5jcmVhdGVWaWV3KCdmcmllbmRzJywgJzEnLCAoZG9jdW1lbnQsIGVtaXR0ZXIpID0+IHtcbiAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRUeXBlID09PSAnRnJpZW5kJykge1xuICAgICAgICBlbWl0dGVyLmVtaXQoZG9jdW1lbnQudGltZUxhc3RNZXNzYWdlLCBkb2N1bWVudCk7ICAgICAvLyBjYWxsIGJhY2sgd2l0aCB0aGlzIGRvY3VtZW50O1xuICAgIH07XG59KTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBVdGlsaXR5IGZ1bmN0aW9ucyBleHBvc2VkIHRvIGFsbCBvdGhlciBWaWV3cywgd2hpY2ggYWJzdHJhY3QgYXdheSBjb21wbGV0ZWx5IGZyb20gdGhlIERCIGJhY2tlbmQuIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gR2VuZXJhbCBBcHAgZGV0YWlscyBkYXRhIGFuZCBEYXRhYmFzZSBpbml0YWxpc2F0aW9uXG5cbnZhciBhcHBEb2N1bWVudFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FwcERhdGFBbHJlYWR5SW5pdGlhbGlzZWQoKTogQm9vbGVhbiB7XG4gICAgaWYgKGFwcERvY3VtZW50UmVmKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBEYXRhIHtcblxuICAgIHByaXZhdGUgZmlyZWJhc2VJbml0ID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyB0b2tlbjogc3RyaW5nIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZpcmViYXNlLmluaXQoe1xuXG4gICAgICAgICAgICAgICAgb25NZXNzYWdlUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKG5vdGlmaWNhdGlvbjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubWVzc2FnZVRvRmV0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHJpZXZlQWxsTWVzc2FnZXMoKS50aGVuKG1lc3NhZ2VzQXJyYXkgPT4gbm90aWZpY2F0aW9uU2VydmljZS5hbGVydE5ld01lc3NhZ2VzKG1lc3NhZ2VzQXJyYXkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24ubXlEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVBZGRGcmllbmROb3RpZmljYXRpb24obm90aWZpY2F0aW9uLm5vdGlmaWNhdGlvbklkLCBub3RpZmljYXRpb24ubXlEZXRhaWxzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBvblB1c2hUb2tlblJlY2VpdmVkQ2FsbGJhY2s6IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRva2VuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhcnRBcHBEYXRhKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLmZpcmViYXNlSW5pdCgpLnRoZW4oZmlyZWJhc2VNZXNzYWdpbmdUb2tlbiA9PiB7XG4gICAgICAgICAgICAgICAgZmlyZWJhc2UubG9naW4oe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaXJlYmFzZS5Mb2dpblR5cGUuUEFTU1dPUkQsXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IGFwcERvY3VtZW50UmVmLnNldHRpbmdzLnJhbmRvbUlkZW50aXR5LnBhc3N3b3JkXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4odXNlciA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0Vycm9yOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdBcHAgSW5pdGlhbGlzZWQhJyk7ICAgICAgICAgICAvLyBkbyBub3Qgd2FpdCBmb3IgZmlyZWJhc2UgLSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIHNlZSBsb2NhbCBkYXRhXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2VuZXJhdGVSYW5kb21GaXJlYmFzZVVzZXIoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGRhdGFiYXNlLmRlbGV0ZURvY3VtZW50KCdzcXVlYWstYXBwJyk7XG5cbiAgICAgICAgICAgIHRoaXMuZmlyZWJhc2VJbml0KCkudGhlbihmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZG9tRW1haWwgPSBnZXRSYW5kb21pc2hTdHJpbmcoKSArICdAJyArIGdldFJhbmRvbWlzaFN0cmluZygpICsgJy5jb20nO1xuICAgICAgICAgICAgICAgIHZhciByYW5kb21QYXNzd29yZCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgZ2V0UmFuZG9taXNoU3RyaW5nKCk7XG5cbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5jcmVhdGVVc2VyKHtcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IHJhbmRvbUVtYWlsLFxuICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogcmFuZG9tUGFzc3dvcmRcbiAgICAgICAgICAgICAgICB9KS50aGVuKHVzZXIgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlTWVzc2FnaW5nVG9rZW46IGZpcmViYXNlTWVzc2FnaW5nVG9rZW5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgnRmFpbGVkIHRvIHJlZ2lzdGVyIEFub255bW91cyBpZGVudGl0eSBvbiByZW1vdGUgc2VydmVycyAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzYXZlUmFuZG9tVXNlckxvY2FsbHkodXNlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQoe1xuICAgICAgICAgICAgICAgIGFwcE5hbWU6ICdTcXVlYWsnLFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgIGF2YXRhclBhdGg6ICd+L2ltYWdlcy9hdmF0YXIucG5nJyxcbiAgICAgICAgICAgICAgICAgICAgbmlja25hbWU6ICdTcXVlYWsnLFxuICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZVVJRDogdXNlci5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICAgICAgZmNtTWVzc2FnaW5nVG9rZW46IHVzZXIuZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgcmFuZG9tSWRlbnRpdHk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHVzZXIucGFzc3dvcmRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sICdzcXVlYWstYXBwJyk7XG4gICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICB1c2VyVUlEOiB1c2VyLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgICAgIGZpcmViYXNlTWVzc2FnaW5nVG9rZW46IHVzZXIuZmlyZWJhc2VNZXNzYWdpbmdUb2tlblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVGaXJlYmFzZVJlY29yZHModXNlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgJy91c2Vycy8nICsgdXNlci51c2VyVUlELFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgazogJycsXG4gICAgICAgICAgICAgICAgICAgIHQ6IHVzZXIuZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgeDogW10sXG4gICAgICAgICAgICAgICAgICAgIHo6IFtdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdBcHAgRGF0YSBpbml0aWFsaXNlZC4nKTtcbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydCgnRmFpbGVkIHRvIHNldCBVc2VyIGRldGFpbHMgb24gcmVtb3RlIHNlcnZlcnMgJyArIGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cblxuLy8gTG9jYWwgYWNjb3VudCByZWxhdGVkIGRhdGFcblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoTG9jYWxBY2NvdW50RGV0YWlscygpIHtcbiAgICByZXR1cm4gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUxvY2FsTmlja25hbWUobmlja25hbWUpIHtcbiAgICB2YXIgbG9jYWxTZXR0aW5nc0RvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcbiAgICBsb2NhbFNldHRpbmdzRG9jdW1lbnQuc2V0dGluZ3Mubmlja25hbWUgPSBuaWNrbmFtZTtcbiAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCgnc3F1ZWFrLWFwcCcsIGxvY2FsU2V0dGluZ3NEb2N1bWVudCk7XG59XG5cblxuLy8gRnJpZW5kcyBMaXN0IHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RnJpZW5kKGZyaWVuZElkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kSWQpO1xufVxuXG5leHBvcnQgdmFyIGdldEZyaWVuZHNMaXN0ID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyBmcmllbmRzTGlzdDogQXJyYXk8T2JqZWN0PiB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgZnJpZW5kc0xpc3RRdWVyeSA9IGRhdGFiYXNlLmV4ZWN1dGVRdWVyeSgnZnJpZW5kcycpO1xuICAgICAgICBpZiAoZnJpZW5kc0xpc3RRdWVyeSkge1xuICAgICAgICAgICAgcmVzb2x2ZShmcmllbmRzTGlzdFF1ZXJ5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdCgnQ291bGQgbm90IG9idGFpbiBMaXN0IG9mIEZyaWVuZHMgZnJvbSBEYXRhYmFzZScpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgYWRkRnJpZW5kID0gZnVuY3Rpb24gKGZpcmViYXNlSWQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG15UHJvZmlsZSA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJykuc2V0dGluZ3M7XG4gICAgICAgIHZhciBwYXRoID0gJy91c2Vycy8nICsgbXlQcm9maWxlLmZpcmViYXNlVUlEICsgJy94JztcblxuICAgICAgICAvLyBhZGQgdGhpcyB1c2VyIGNvZGUgLyBmaXJlYmFzZSBJZCB0byB0aGUgbGlzdCBvZiBwZW9wbGUgd2hvIGNhbiBtZXNzYWdlIG1lXG4gICAgICAgIGZpcmViYXNlLnB1c2goXG4gICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgZmlyZWJhc2VJZFxuICAgICAgICApLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBub3RpZnkgZnJpZW5kIHdpdGggb3VyIG93biBkZXRhaWxzXG4gICAgICAgICAgICB2YXIgZW5jcnlwdGVkTXlEZXRhaWxzID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIC8vIHRvIGJlIGVuY3J5cHRlZFxuICAgICAgICAgICAgICAgIG5pY2tuYW1lOiBteVByb2ZpbGUubmlja25hbWUsXG4gICAgICAgICAgICAgICAgZmlyZWJhc2VJZDogbXlQcm9maWxlLmZpcmViYXNlVUlEXG4gICAgICAgICAgICAgICAgLy8gYXZhdGFyOlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGZpcmViYXNlLnB1c2goXG4gICAgICAgICAgICAgICAgJ25vdGlmaWNhdGlvbnMnLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0VXNlcjogZmlyZWJhc2VJZCxcbiAgICAgICAgICAgICAgICAgICAgbXlEZXRhaWxzOiBlbmNyeXB0ZWRNeURldGFpbHNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdmFyIGZyaWVuZFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KGZpcmViYXNlSWQpO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgZnJpZW5kUmVmIGRvZXMgbm90IGV4aXN0LCBpbml0aWFsaXNlIHRlbXBvcmFyeSB2YWx1ZXNcbiAgICAgICAgICAgICAgICBpZiAoIWZyaWVuZFJlZikge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vICAgU2V0IHByZWxpbWluYXJ5IGRldGFpbHMgZGV0YWlscyBmb3IgZnJpZW5kXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdGcmllbmQgPSBuZXcgRnJpZW5kKCdQZW5kaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZC5sYXN0TWVzc2FnZVByZXZpZXcgPSAnV2FpdGluZyBmb3IgZnJpZW5kIGNvbmZpcm1hdGlvbi4uLiAoY29kZTogJyArIGZpcmViYXNlSWQgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KG5ld0ZyaWVuZCwgZmlyZWJhc2VJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FkZGVkIE5ldyBGcmllbmQnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlQWRkRnJpZW5kTm90aWZpY2F0aW9uKG5vdGlmaWNhdGlvbklkLCBlbmNyeXB0ZWRGcmllbmREZXRhaWxzKSB7XG5cbiAgICB2YXIgZnJpZW5kID0gSlNPTi5wYXJzZShlbmNyeXB0ZWRGcmllbmREZXRhaWxzKTtcblxuICAgIGxldCBsb2NhbEZyaWVuZFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KGZyaWVuZC5maXJlYmFzZUlkKTtcblxuICAgIC8vIGlmIHdlIGFscmVhZHkgaGF2ZSBhIHJlY29yZCBmb3IgdGhhdCBmcmllbmQgKGkuZS4gdGhleSBnYXZlIHVzIHRoZSBjb2RlKSwgdXBkYXRlIHRoZSBGcmllbmQgcmVjb3JkXG4gICAgaWYgKGxvY2FsRnJpZW5kUmVmKSB7XG5cbiAgICAgICAgbG9jYWxGcmllbmRSZWYubmlja25hbWUgPSBmcmllbmQubmlja25hbWU7XG4gICAgICAgIGxvY2FsRnJpZW5kUmVmLmxhc3RNZXNzYWdlUHJldmlldyA9ICdOZXcgRnJpZW5kJztcbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQsIGxvY2FsRnJpZW5kUmVmKTtcblxuICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kQ29uZmlybWF0aW9uKGZyaWVuZC5uaWNrbmFtZSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIGlmIHdlIGRvIG5vdCBoYXZlIGEgcmVjb3JkIGZvciB0aGF0IGZyaWVuZCAoaS5lLiB3ZSBnYXZlIHRoZW0gdGhlIGNvZGUpLCByZXF1ZXN0IHBlcm1pc3Npb24gdG8gYWRkIHRoZW0gdG8gb3VyIGZyaWVuZHMgbGlzdFxuICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kUmVxdWVzdChmcmllbmQubmlja25hbWUpXG4gICAgICAgICAgICAudGhlbihjb25maXJtYXRpb24gPT4ge1xuICAgICAgICAgICAgICAgIC8vIGlmIHdlIHJlY2VpdmUgYSB0cnVlIHZhbHVlICg9PSBhY2NlcHQpIGZyb20gdGhlIFByb21pc2VcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlybWF0aW9uKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gYWRkIEZyaWVuZCByZWNvcmQgd2l0aCBpbml0aWFsIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICBhZGRGcmllbmQoZnJpZW5kLmZpcmViYXNlSWQpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVuIHVwZGF0ZSB3aXRoIHRoZSBhY3R1YWwgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbG9jYWxGcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbEZyaWVuZFJlZi5uaWNrbmFtZSA9IGZyaWVuZC5uaWNrbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsRnJpZW5kUmVmLmxhc3RNZXNzYWdlUHJldmlldyA9ICdOZXcgRnJpZW5kJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGZyaWVuZC5maXJlYmFzZUlkLCBsb2NhbEZyaWVuZFJlZik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblNlcnZpY2UuYWxlcnRGcmllbmRDb25maXJtYXRpb24oZnJpZW5kLm5pY2tuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB2YXIgcmVtb3ZlRnJpZW5kID0gZnVuY3Rpb24gKHRhcmdldElkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGRhdGFiYXNlLmRlbGV0ZURvY3VtZW50KHRhcmdldElkKTtcblxuICAgICAgICByZXNvbHZlKCdSZW1vdmVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHVwZGF0ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nLCBuZXdQcm9wZXJ0aWVzOiBPYmplY3QpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KHRhcmdldElkLCBuZXdQcm9wZXJ0aWVzKTtcblxuICAgICAgICByZXNvbHZlKCdFZGl0ZWQgRnJpZW5kJyk7XG4gICAgfSk7XG59XG5cblxuLy8gTWVzc2FnZXMgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCB2YXIgc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbiAoY2hhdElkOiBzdHJpbmcsIG1lc3NhZ2VUZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgbmV3RnJpZW5kRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudChjaGF0SWQpO1xuICAgICAgICB2YXIgbmV3TWVzc2FnZSA9IG5ldyBNZXNzYWdlKG1lc3NhZ2VUZXh0LCB0cnVlKTtcblxuICAgICAgICAvLyBzdG9yZSB0aGUgbWVzc2FnZSBpbiBtZW1vcnkgIFxuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VBdXRob3IgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpLnNldHRpbmdzLmZpcmViYXNlVUlEO1xuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVN0YXR1cyA9ICdTZW5kaW5nLi4uJztcbiAgICAgICAgdmFyIG5ld01lc3NhZ2VJbmRleCA9IG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuXG4gICAgICAgIC8vIHByZXBhcmUgbWVzc2FnZSBmb3Igc2VuZGluZ1xuICAgICAgICB2YXIgZW5jcnlwdGVkTWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIG1lc3NhZ2VBdXRob3I6IG5ld01lc3NhZ2UubWVzc2FnZUF1dGhvcixcbiAgICAgICAgICAgIG1lc3NhZ2VUZXh0OiBuZXdNZXNzYWdlLm1lc3NhZ2VUZXh0LFxuICAgICAgICAgICAgbWVzc2FnZVRpbWVTZW50OiBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBwdXNoIG1lc3NhZ2UgdG8gZmlyZWJhc2VcbiAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICcvdXNlcnMvJyArIG5ld0ZyaWVuZERvY3VtZW50Ll9pZCArICcveicsXG4gICAgICAgICAgICBlbmNyeXB0ZWRNZXNzYWdlXG4gICAgICAgIClcbiAgICAgICAgICAgIC8vdGhlbiB1cGRhdGUgdGhlIGxvY2FsIHN0YXRlICAgIFxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIlNlbnRcIjtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCdNZXNzYWdlIFNlbnQnKTtcblxuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZXRyaWV2ZUFsbE1lc3NhZ2VzKCk6IFByb21pc2U8QXJyYXk8T2JqZWN0Pj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG15SWQgPSBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5maXJlYmFzZVVJRDtcbiAgICAgICAgdmFyIGV2ZW50TGlzdGVuZXJzO1xuICAgICAgICB2YXIgbXlNZXNzYWdlc1BhdGggPSAndXNlcnMvJyArIG15SWQgKyAnL3onO1xuXG4gICAgICAgIGZpcmViYXNlLmFkZFZhbHVlRXZlbnRMaXN0ZW5lcihzbmFwc2hvdCA9PiB7XG5cbiAgICAgICAgICAgIC8vIG9ubHkgZ2V0IGV4Y2l0ZWQgd2hlbiB0aGluZ3MgYXJlIEFkZGVkIHRvIHRoZSBQYXRoLCBub3QgYWxzbyBvbiB0aGUgUmVtb3ZlIGV2ZW50IHdoaWNoIGlzIHRyaWdnZXJlZCBsYXRlci5cbiAgICAgICAgICAgIGlmIChzbmFwc2hvdC52YWx1ZSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2VzQXJyYXkgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIga2V5c0FycmF5ID0gT2JqZWN0LmtleXMoc25hcHNob3QudmFsdWUpO1xuICAgICAgICAgICAgICAgIGtleXNBcnJheS5mb3JFYWNoKGtleSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlY3J5cHRlZE1lc3NhZ2UgPSBKU09OLnBhcnNlKHNuYXBzaG90LnZhbHVlW2tleV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBuZXcgTWVzc2FnZSgpIGZvciBsb2NhbCBjb25zdW1wdGlvblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3TWVzc2FnZSA9IG5ldyBNZXNzYWdlKCcnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZUF1dGhvciA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZUF1dGhvcjtcbiAgICAgICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRpbWVTZW50ID0gbmV3IERhdGUoZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlVGltZVNlbnQpO1xuICAgICAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhdmUgdGhpcyBtZXNzYWdlIHRvIHJldHVybiB0byB0aGUgbm90aWZpY2F0aW9uIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXNBcnJheS5wdXNoKG5ld01lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB1cGRhdGVkIEZyaWVuZCBSZWNvcmRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldEZyaWVuZCA9IGdldEZyaWVuZChkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VBdXRob3IpO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQubWVzc2FnZXMucHVzaChuZXdNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnRpbWVMYXN0TWVzc2FnZSA9IG5ld01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLmxhc3RNZXNzYWdlUHJldmlldyA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC51bnJlYWRNZXNzYWdlc051bWJlciArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgZGF0YWJhc2VcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlQXV0aG9yLCB0YXJnZXRGcmllbmQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZXZlbnRMaXN0ZW5lcnMsIG15TWVzc2FnZXNQYXRoKTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShteU1lc3NhZ2VzUGF0aCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlc0FycmF5KTtcblxuICAgICAgICAgICAgfSBlbHNlIHJlamVjdCgnQ291bGQgbm90IGZpbmQgYW55IG1lc3NhZ2Ugb24gRmlyZWJhc2UnKTtcblxuICAgICAgICB9LCBteU1lc3NhZ2VzUGF0aCkudGhlbihsaXN0ZW5lcldyYXBwZXIgPT4ge1xuXG4gICAgICAgICAgICAvLyBnZXQgZXZlbnRMaXN0ZW5lcnMgcmVmXG4gICAgICAgICAgICBldmVudExpc3RlbmVycyA9IGxpc3RlbmVyV3JhcHBlci5saXN0ZW5lcnM7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIFJhbmRvbSB1dGlsaXR5IGZ1bmN0aW9uc1xuXG5mdW5jdGlvbiBnZXRSYW5kb21pc2hTdHJpbmcoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xufSJdfQ==