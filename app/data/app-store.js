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
                            retrieveMessage(notification.targetUser, notification.messageToFetch)
                                .then(function (sender) {
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
        newMessage.messageTimeSent = new Date();
        newMessage.messageStatus = 'Sending...';
        var newMessageIndex = newFriendDocument.messages.push(newMessage);
        database.updateDocument(chatId, newFriendDocument);
        // prepare message for sending
        var encryptedMessage = JSON.stringify({
            messageAuthor: database.getDocument('squeak-app').settings.firebaseUID,
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
var retrieveMessage = function (targetUser, messageRef) {
    return new Promise(function (resolve, reject) {
        var myMessagePath = 'users/' + targetUser + '/z/' + messageRef;
        firebase.addValueEventListener(function (snapshot) {
            // only get excited when things are Added to the Path, not also on the Remove event which is triggered later.
            if (snapshot.value) {
                var decryptedMessage = JSON.parse(snapshot.value);
                // create new Message() for local consumption
                var newMessage = new app_data_model_1.Message('', false);
                newMessage.messageText = decryptedMessage.messageText;
                newMessage.messageTimeSent = new Date(decryptedMessage.messageTimeSent);
                newMessage.messageTimeReceived = new Date();
                // update Friend Record                
                var targetFriend = getFriend(decryptedMessage.messageAuthor);
                targetFriend.messages.push(newMessage);
                targetFriend.timeLastMessage = newMessage.messageTimeReceived;
                targetFriend.lastMessagePreview = decryptedMessage.messageText;
                targetFriend.unreadMessagesNumber += 1;
                database.updateDocument(decryptedMessage.messageAuthor, targetFriend);
                firebase.setValue(myMessagePath, null).then(function () {
                    // resolve({
                    //     id: decryptedMessage.messageAuthor,
                    //     nickname: targetFriend.nickname
                    // });
                });
                resolve({
                    id: decryptedMessage.messageAuthor,
                    nickname: targetFriend.nickname
                });
            }
            reject('Message no found on Firebase');
        }, myMessagePath)
            .catch(function (error) {
            alert(error);
            reject();
        });
    });
};
// Random utility functions
function getRandomishString() {
    return Math.random().toString(36).slice(2);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUNuRCxvREFBc0Q7QUFFdEQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRWhELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSEQsd0VBR0M7QUFFRDtJQUFBO1FBRVksaUJBQVksR0FBRztZQUNu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QUNaLDBDQUEwQztvQkFDMUMsc0NBQXNDO29CQUN0QyxNQUFNO2dCQUNWLENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU8sQ0FBQztvQkFDSixFQUFFLEVBQUUsZ0JBQWdCLENBQUMsYUFBYTtvQkFDbEMsUUFBUSxFQUFFLFlBQVksQ0FBQyxRQUFRO2lCQUNsQyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBRUQsTUFBTSxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDM0MsQ0FBQyxFQUFFLGFBQWEsQ0FBQzthQUNaLEtBQUssQ0FBQyxVQUFBLEtBQUs7WUFDUixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDYixNQUFNLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFHRCwyQkFBMkI7QUFFM0I7SUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZpcmViYXNlIGZyb20gJ25hdGl2ZXNjcmlwdC1wbHVnaW4tZmlyZWJhc2UnO1xuaW1wb3J0IHsgQ291Y2hiYXNlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWNvdWNoYmFzZSc7XG5cbmltcG9ydCB7IEZyaWVuZCwgTWVzc2FnZSB9IGZyb20gJy4vYXBwLWRhdGEtbW9kZWwnO1xuaW1wb3J0ICogYXMgbm90aWZpY2F0aW9uU2VydmljZSBmcm9tICcuL25vdGlmaWNhdGlvbic7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBBUEk6XG4vLyBcbi8vIGluaXRGcmllbmRzRGF0YSgpLnRoZW4oPGRvIHN0dWZmPikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBpbml0YWxpc2VzIHRoZSBEYXRhYmFzZSBhbmQgdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gZ2V0RnJpZW5kc0xpc3QoKS50aGVuKCBmcmllbmRzTGlzdCA9PiB7IDxkbyBzdHVmZiB3aXRoIGZyaWVuZHNMaXN0IEFycmF5PiB9ICkgICAgICAgIC0tIGdldHMgdGhlIGZyaWVuZHNMaXN0IGFzIGFuIEFycmF5XG4vLyBhZGRGcmllbmQoPGZyaWVuZCBuaWNrbmFtZT4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyByZW1vdmVGcmllbmQoPGZyaWVuZCBfaWQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyB1cGRhdGVGcmllbmQoPGZyaWVuZCBfaWQ+LCA8bmV3IGRhdGEgY29udGVudD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gQ291Y2hiYXNlIGluaXRpYWwgY29uZmlndXJhdGlvblxuY29uc3QgREJfY29uZmlnID0ge1xuICAgIGRiX25hbWU6ICdjb3VjaGJhc2UuZGInLFxufVxudmFyIGRhdGFiYXNlID0gbmV3IENvdWNoYmFzZShEQl9jb25maWcuZGJfbmFtZSk7XG5cbi8vIFByZS1kZWZpbmUgUXVlcmllc1xuZGF0YWJhc2UuY3JlYXRlVmlldygnZnJpZW5kcycsICcxJywgKGRvY3VtZW50LCBlbWl0dGVyKSA9PiB7XG4gICAgaWYgKGRvY3VtZW50LmRvY3VtZW50VHlwZSA9PT0gJ0ZyaWVuZCcpIHtcbiAgICAgICAgZW1pdHRlci5lbWl0KGRvY3VtZW50LnRpbWVMYXN0TWVzc2FnZSwgZG9jdW1lbnQpOyAgICAgLy8gY2FsbCBiYWNrIHdpdGggdGhpcyBkb2N1bWVudDtcbiAgICB9O1xufSk7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gVXRpbGl0eSBmdW5jdGlvbnMgZXhwb3NlZCB0byBhbGwgb3RoZXIgVmlld3MsIHdoaWNoIGFic3RyYWN0IGF3YXkgY29tcGxldGVseSBmcm9tIHRoZSBEQiBiYWNrZW5kLiBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIEdlbmVyYWwgQXBwIGRldGFpbHMgZGF0YSBhbmQgRGF0YWJhc2UgaW5pdGFsaXNhdGlvblxuXG52YXIgYXBwRG9jdW1lbnRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBcHBEYXRhQWxyZWFkeUluaXRpYWxpc2VkKCk6IEJvb2xlYW4ge1xuICAgIGlmIChhcHBEb2N1bWVudFJlZikgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwRGF0YSB7XG5cbiAgICBwcml2YXRlIGZpcmViYXNlSW5pdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgdG9rZW46IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBmaXJlYmFzZS5pbml0KHtcblxuICAgICAgICAgICAgICAgIG9uTWVzc2FnZVJlY2VpdmVkQ2FsbGJhY2s6IGZ1bmN0aW9uIChub3RpZmljYXRpb246IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm90aWZpY2F0aW9uLm1lc3NhZ2VUb0ZldGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRyaWV2ZU1lc3NhZ2Uobm90aWZpY2F0aW9uLnRhcmdldFVzZXIsIG5vdGlmaWNhdGlvbi5tZXNzYWdlVG9GZXRjaClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihzZW5kZXIgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0TmV3TWVzc2FnZShzZW5kZXIubmlja25hbWUsIHNlbmRlci5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobm90aWZpY2F0aW9uLm15RGV0YWlscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlQWRkRnJpZW5kTm90aWZpY2F0aW9uKG5vdGlmaWNhdGlvbi5ub3RpZmljYXRpb25JZCwgbm90aWZpY2F0aW9uLm15RGV0YWlscyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgb25QdXNoVG9rZW5SZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0QXBwRGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuICAgICAgICAgICAgICAgIGZpcmViYXNlLmxvZ2luKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlyZWJhc2UuTG9naW5UeXBlLlBBU1NXT1JELFxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5wYXNzd29yZFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHVzZXIgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvcjogJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIEluaXRpYWxpc2VkIScpOyAgICAgICAgICAgLy8gZG8gbm90IHdhaXQgZm9yIGZpcmViYXNlIC0gdXNlciBzaG91bGQgYmUgYWJsZSB0byBzZWUgbG9jYWwgZGF0YVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdlbmVyYXRlUmFuZG9tRmlyZWJhc2VVc2VyKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgICAgICB0aGlzLmZpcmViYXNlSW5pdCgpLnRoZW4oZmlyZWJhc2VNZXNzYWdpbmdUb2tlbiA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbUVtYWlsID0gZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnQCcgKyBnZXRSYW5kb21pc2hTdHJpbmcoKSArICcuY29tJztcbiAgICAgICAgICAgICAgICB2YXIgcmFuZG9tUGFzc3dvcmQgPSBnZXRSYW5kb21pc2hTdHJpbmcoKSArIGdldFJhbmRvbWlzaFN0cmluZygpO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UuY3JlYXRlVXNlcih7XG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkXG4gICAgICAgICAgICAgICAgfSkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZVVJRDogdXNlci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogcmFuZG9tRW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogcmFuZG9tUGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuOiBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byByZWdpc3RlciBBbm9ueW1vdXMgaWRlbnRpdHkgb24gcmVtb3RlIHNlcnZlcnMgJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2F2ZVJhbmRvbVVzZXJMb2NhbGx5KHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KHtcbiAgICAgICAgICAgICAgICBhcHBOYW1lOiAnU3F1ZWFrJyxcbiAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICBhdmF0YXJQYXRoOiAnfi9pbWFnZXMvYXZhdGFyLnBuZycsXG4gICAgICAgICAgICAgICAgICAgIG5pY2tuYW1lOiAnU3F1ZWFrJyxcbiAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2VVSUQ6IHVzZXIuZmlyZWJhc2VVSUQsXG4gICAgICAgICAgICAgICAgICAgIGZjbU1lc3NhZ2luZ1Rva2VuOiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW4sXG4gICAgICAgICAgICAgICAgICAgIHJhbmRvbUlkZW50aXR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB1c2VyLnBhc3N3b3JkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAnc3F1ZWFrLWFwcCcpO1xuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgdXNlclVJRDogdXNlci5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuOiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlRmlyZWJhc2VSZWNvcmRzKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZpcmViYXNlLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICcvdXNlcnMvJyArIHVzZXIudXNlclVJRCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGs6ICcnLFxuICAgICAgICAgICAgICAgICAgICB0OiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW4sXG4gICAgICAgICAgICAgICAgICAgIHg6IFtdLFxuICAgICAgICAgICAgICAgICAgICB6OiBbXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIERhdGEgaW5pdGlhbGlzZWQuJyk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byBzZXQgVXNlciBkZXRhaWxzIG9uIHJlbW90ZSBzZXJ2ZXJzICcgKyBlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5cbi8vIExvY2FsIGFjY291bnQgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBmZXRjaExvY2FsQWNjb3VudERldGFpbHMoKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVMb2NhbE5pY2tuYW1lKG5pY2tuYW1lKSB7XG4gICAgdmFyIGxvY2FsU2V0dGluZ3NEb2N1bWVudCA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG4gICAgbG9jYWxTZXR0aW5nc0RvY3VtZW50LnNldHRpbmdzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoJ3NxdWVhay1hcHAnLCBsb2NhbFNldHRpbmdzRG9jdW1lbnQpO1xufVxuXG5cbi8vIEZyaWVuZHMgTGlzdCByZWxhdGVkIGRhdGFcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZyaWVuZChmcmllbmRJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KGZyaWVuZElkKTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIGZyaWVuZHNMaXN0UXVlcnkgPSBkYXRhYmFzZS5leGVjdXRlUXVlcnkoJ2ZyaWVuZHMnKTtcbiAgICAgICAgaWYgKGZyaWVuZHNMaXN0UXVlcnkpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZnJpZW5kc0xpc3RRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoJ0NvdWxkIG5vdCBvYnRhaW4gTGlzdCBvZiBGcmllbmRzIGZyb20gRGF0YWJhc2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChmaXJlYmFzZUlkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBteVByb2ZpbGUgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpLnNldHRpbmdzO1xuICAgICAgICB2YXIgcGF0aCA9ICcvdXNlcnMvJyArIG15UHJvZmlsZS5maXJlYmFzZVVJRCArICcveCc7XG5cbiAgICAgICAgLy8gYWRkIHRoaXMgdXNlciBjb2RlIC8gZmlyZWJhc2UgSWQgdG8gdGhlIGxpc3Qgb2YgcGVvcGxlIHdobyBjYW4gbWVzc2FnZSBtZVxuICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgIGZpcmViYXNlSWRcbiAgICAgICAgKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgLy8gbm90aWZ5IGZyaWVuZCB3aXRoIG91ciBvd24gZGV0YWlsc1xuICAgICAgICAgICAgdmFyIGVuY3J5cHRlZE15RGV0YWlscyA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAvLyB0byBiZSBlbmNyeXB0ZWRcbiAgICAgICAgICAgICAgICBuaWNrbmFtZTogbXlQcm9maWxlLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgIGZpcmViYXNlSWQ6IG15UHJvZmlsZS5maXJlYmFzZVVJRFxuICAgICAgICAgICAgICAgIC8vIGF2YXRhcjpcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICdub3RpZmljYXRpb25zJyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFVzZXI6IGZpcmViYXNlSWQsXG4gICAgICAgICAgICAgICAgICAgIG15RGV0YWlsczogZW5jcnlwdGVkTXlEZXRhaWxzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIHZhciBmcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmaXJlYmFzZUlkKTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGZyaWVuZFJlZiBkb2VzIG5vdCBleGlzdCwgaW5pdGlhbGlzZSB0ZW1wb3JhcnkgdmFsdWVzXG4gICAgICAgICAgICAgICAgaWYgKCFmcmllbmRSZWYpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyAgIFNldCBwcmVsaW1pbmFyeSBkZXRhaWxzIGRldGFpbHMgZm9yIGZyaWVuZFxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RnJpZW5kID0gbmV3IEZyaWVuZCgnUGVuZGluZycpO1xuICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmQubGFzdE1lc3NhZ2VQcmV2aWV3ID0gJ1dhaXRpbmcgZm9yIGZyaWVuZCBjb25maXJtYXRpb24uLi4gKGNvZGU6ICcgKyBmaXJlYmFzZUlkICsgJyknO1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudChuZXdGcmllbmQsIGZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKCdBZGRlZCBOZXcgRnJpZW5kJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUFkZEZyaWVuZE5vdGlmaWNhdGlvbihub3RpZmljYXRpb25JZCwgZW5jcnlwdGVkRnJpZW5kRGV0YWlscykge1xuXG4gICAgdmFyIGZyaWVuZCA9IEpTT04ucGFyc2UoZW5jcnlwdGVkRnJpZW5kRGV0YWlscyk7XG5cbiAgICBsZXQgbG9jYWxGcmllbmRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCk7XG5cbiAgICAvLyBpZiB3ZSBhbHJlYWR5IGhhdmUgYSByZWNvcmQgZm9yIHRoYXQgZnJpZW5kIChpLmUuIHRoZXkgZ2F2ZSB1cyB0aGUgY29kZSksIHVwZGF0ZSB0aGUgRnJpZW5kIHJlY29yZFxuICAgIGlmIChsb2NhbEZyaWVuZFJlZikge1xuXG4gICAgICAgIGxvY2FsRnJpZW5kUmVmLm5pY2tuYW1lID0gZnJpZW5kLm5pY2tuYW1lO1xuICAgICAgICBsb2NhbEZyaWVuZFJlZi5sYXN0TWVzc2FnZVByZXZpZXcgPSAnTmV3IEZyaWVuZCc7XG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGZyaWVuZC5maXJlYmFzZUlkLCBsb2NhbEZyaWVuZFJlZik7XG5cbiAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZENvbmZpcm1hdGlvbihmcmllbmQubmlja25hbWUpO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhIHJlY29yZCBmb3IgdGhhdCBmcmllbmQgKGkuZS4gd2UgZ2F2ZSB0aGVtIHRoZSBjb2RlKSwgcmVxdWVzdCBwZXJtaXNzaW9uIHRvIGFkZCB0aGVtIHRvIG91ciBmcmllbmRzIGxpc3RcbiAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZFJlcXVlc3QoZnJpZW5kLm5pY2tuYW1lKVxuICAgICAgICAgICAgLnRoZW4oY29uZmlybWF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICAvLyBpZiB3ZSByZWNlaXZlIGEgdHJ1ZSB2YWx1ZSAoPT0gYWNjZXB0KSBmcm9tIHRoZSBQcm9taXNlXG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpcm1hdGlvbikge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCBGcmllbmQgcmVjb3JkIHdpdGggaW5pdGlhbCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgYWRkRnJpZW5kKGZyaWVuZC5maXJlYmFzZUlkKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiB1cGRhdGUgd2l0aCB0aGUgYWN0dWFsIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvY2FsRnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxGcmllbmRSZWYubmlja25hbWUgPSBmcmllbmQubmlja25hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbEZyaWVuZFJlZi5sYXN0TWVzc2FnZVByZXZpZXcgPSAnTmV3IEZyaWVuZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCwgbG9jYWxGcmllbmRSZWYpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kQ29uZmlybWF0aW9uKGZyaWVuZC5uaWNrbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnUmVtb3ZlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciB1cGRhdGVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZERvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoY2hhdElkKTtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc3RvcmUgdGhlIG1lc3NhZ2UgaW4gbWVtb3J5ICAgICAgICBcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnU2VuZGluZy4uLic7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlSW5kZXggPSBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcblxuICAgICAgICAvLyBwcmVwYXJlIG1lc3NhZ2UgZm9yIHNlbmRpbmdcbiAgICAgICAgdmFyIGVuY3J5cHRlZE1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBtZXNzYWdlQXV0aG9yOiBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpLnNldHRpbmdzLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgbWVzc2FnZVRleHQ6IG5ld01lc3NhZ2UubWVzc2FnZVRleHQsXG4gICAgICAgICAgICBtZXNzYWdlVGltZVNlbnQ6IG5ld01lc3NhZ2UubWVzc2FnZVRpbWVTZW50XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHB1c2ggbWVzc2FnZSB0byBmaXJlYmFzZVxuICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgJy91c2Vycy8nICsgbmV3RnJpZW5kRG9jdW1lbnQuX2lkICsgJy96JyxcbiAgICAgICAgICAgIGVuY3J5cHRlZE1lc3NhZ2VcbiAgICAgICAgKVxuICAgICAgICAgICAgLy90aGVuIHVwZGF0ZSB0aGUgbG9jYWwgc3RhdGUgICAgXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0ubWVzc2FnZVN0YXR1cyA9IFwiU2VudFwiO1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoJ01lc3NhZ2UgU2VudCcpO1xuXG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0ubWVzc2FnZVN0YXR1cyA9IFwiRmFpbGVkXCI7XG4gICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbnZhciByZXRyaWV2ZU1lc3NhZ2UgPSBmdW5jdGlvbiAodGFyZ2V0VXNlcjogc3RyaW5nLCBtZXNzYWdlUmVmOiBzdHJpbmcpOiBQcm9taXNlPHsgaWQ6IHN0cmluZywgbmlja25hbWU6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG15TWVzc2FnZVBhdGggPSAndXNlcnMvJyArIHRhcmdldFVzZXIgKyAnL3ovJyArIG1lc3NhZ2VSZWY7XG4gICAgICAgIGZpcmViYXNlLmFkZFZhbHVlRXZlbnRMaXN0ZW5lcihzbmFwc2hvdCA9PiB7XG5cbiAgICAgICAgICAgIC8vIG9ubHkgZ2V0IGV4Y2l0ZWQgd2hlbiB0aGluZ3MgYXJlIEFkZGVkIHRvIHRoZSBQYXRoLCBub3QgYWxzbyBvbiB0aGUgUmVtb3ZlIGV2ZW50IHdoaWNoIGlzIHRyaWdnZXJlZCBsYXRlci5cbiAgICAgICAgICAgIGlmIChzbmFwc2hvdC52YWx1ZSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGRlY3J5cHRlZE1lc3NhZ2UgPSBKU09OLnBhcnNlKHNuYXBzaG90LnZhbHVlKTtcblxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBuZXcgTWVzc2FnZSgpIGZvciBsb2NhbCBjb25zdW1wdGlvblxuICAgICAgICAgICAgICAgIHZhciBuZXdNZXNzYWdlID0gbmV3IE1lc3NhZ2UoJycsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUZXh0ID0gZGVjcnlwdGVkTWVzc2FnZS5tZXNzYWdlVGV4dDtcbiAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRpbWVTZW50KTtcbiAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIEZyaWVuZCBSZWNvcmQgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldEZyaWVuZCA9IGdldEZyaWVuZChkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VBdXRob3IpO1xuICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC50aW1lTGFzdE1lc3NhZ2UgPSBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQ7XG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLmxhc3RNZXNzYWdlUHJldmlldyA9IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnVucmVhZE1lc3NhZ2VzTnVtYmVyICs9IDE7XG5cbiAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VBdXRob3IsIHRhcmdldEZyaWVuZCk7XG4gICAgICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUobXlNZXNzYWdlUGF0aCwgbnVsbCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWQ6IGRlY3J5cHRlZE1lc3NhZ2UubWVzc2FnZUF1dGhvcixcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIG5pY2tuYW1lOiB0YXJnZXRGcmllbmQubmlja25hbWVcbiAgICAgICAgICAgICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBkZWNyeXB0ZWRNZXNzYWdlLm1lc3NhZ2VBdXRob3IsXG4gICAgICAgICAgICAgICAgICAgIG5pY2tuYW1lOiB0YXJnZXRGcmllbmQubmlja25hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KCdNZXNzYWdlIG5vIGZvdW5kIG9uIEZpcmViYXNlJyk7XG4gICAgICAgIH0sIG15TWVzc2FnZVBhdGgpXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIFJhbmRvbSB1dGlsaXR5IGZ1bmN0aW9uc1xuXG5mdW5jdGlvbiBnZXRSYW5kb21pc2hTdHJpbmcoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xufSJdfQ==