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
                        if (notification.messageToFetchRef) {
                            retrieveMessage(notification.targetUser, notification.messageToFetchRef)
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
                //   Set preliminary details details for friend
                var newFriend = new app_data_model_1.Friend(firebaseId);
                newFriend.lastMessagePreview = 'Waiting for friend confirmation...';
                database.createDocument(newFriend, firebaseId);
                resolve('Added New Friend');
            });
        });
    });
};
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
function handleAddFriendNotification(notificationId, encryptedFriendDetails) {
    var friend = JSON.parse(encryptedFriendDetails);
    var localFriendRef = database.getDocument(friend.firebaseId);
    // if we already have a record for that friend (i.e. they gave us the code), update the Friend record
    if (localFriendRef) {
        localFriendRef.nickname = friend.nickname;
        database.updateDocument(friend.firebaseId, localFriendRef);
        notificationService.alertFriendConfirmation(friend.nickname);
    }
    else {
        // if we do not have a record for that friend (i.e. we gave them the code), request permission to add them to our friends list
        notificationService.alertFriendRequest(friend.nickname)
            .then(function (confirmation) {
            // if we receive a true value (== accept) from the Promise
            if (confirmation) {
                // create Friend record
                var newFriend = new app_data_model_1.Friend(friend.nickname);
                database.createDocument(newFriend, friend.firebaseId);
                notificationService.alertFriendConfirmation(friend.nickname);
            }
        });
    }
}
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
        // push message to firebase
        firebase.push('/users/' + newFriendDocument._id + '/z', {
            messageAuthor: database.getDocument('squeak-app').settings.firebaseUID,
            messageText: newMessage.messageText,
            messageTimeSent: firebase.ServerValue.TIMESTAMP
        })
            .then(function (pushResponse) {
            var sentMessageRef = pushResponse.key;
            firebase.push('notifications', {
                messageToFetchRef: sentMessageRef,
                targetUser: newFriendDocument._id
            })
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
                var received = snapshot.value;
                // create new Message() for local consumption
                var newMessage = new app_data_model_1.Message('', false);
                newMessage.messageText = received.messageText;
                newMessage.messageTimeSent = new Date(received.messageTimeSent);
                newMessage.messageTimeReceived = new Date();
                var targetFriend = getFriend(received.messageAuthor);
                targetFriend.messages.push(newMessage);
                targetFriend.timeLastMessage = newMessage.messageTimeReceived;
                targetFriend.lastMessagePreview = received.messageText; // this could be trimmed or something
                targetFriend.unreadMessagesNumber += 1;
                database.updateDocument(received.messageAuthor, targetFriend);
                firebase.setValue(myMessagePath, null).then(function () {
                    resolve({
                        id: received.messageAuthor,
                        nickname: targetFriend.nickname
                    });
                });
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUNuRCxvREFBc0Q7QUFFdEQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRWhELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSEQsd0VBR0M7QUFFRDtJQUFBO1FBRVksaUJBQVksR0FBRztZQUNu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O3FCQUNsQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDO1FBQ0wsQ0FBQyxFQUFFLGFBQWEsQ0FBQzthQUNaLEtBQUssQ0FBQyxVQUFBLEtBQUs7WUFDUixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDYixNQUFNLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFHRCwyQkFBMkI7QUFFM0I7SUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZpcmViYXNlIGZyb20gJ25hdGl2ZXNjcmlwdC1wbHVnaW4tZmlyZWJhc2UnO1xuaW1wb3J0IHsgQ291Y2hiYXNlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWNvdWNoYmFzZSc7XG5cbmltcG9ydCB7IEZyaWVuZCwgTWVzc2FnZSB9IGZyb20gJy4vYXBwLWRhdGEtbW9kZWwnO1xuaW1wb3J0ICogYXMgbm90aWZpY2F0aW9uU2VydmljZSBmcm9tICcuL25vdGlmaWNhdGlvbic7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBBUEk6XG4vLyBcbi8vIGluaXRGcmllbmRzRGF0YSgpLnRoZW4oPGRvIHN0dWZmPikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBpbml0YWxpc2VzIHRoZSBEYXRhYmFzZSBhbmQgdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gZ2V0RnJpZW5kc0xpc3QoKS50aGVuKCBmcmllbmRzTGlzdCA9PiB7IDxkbyBzdHVmZiB3aXRoIGZyaWVuZHNMaXN0IEFycmF5PiB9ICkgICAgICAgIC0tIGdldHMgdGhlIGZyaWVuZHNMaXN0IGFzIGFuIEFycmF5XG4vLyBhZGRGcmllbmQoPGZyaWVuZCBuaWNrbmFtZT4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyByZW1vdmVGcmllbmQoPGZyaWVuZCBfaWQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyB1cGRhdGVGcmllbmQoPGZyaWVuZCBfaWQ+LCA8bmV3IGRhdGEgY29udGVudD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gQ291Y2hiYXNlIGluaXRpYWwgY29uZmlndXJhdGlvblxuY29uc3QgREJfY29uZmlnID0ge1xuICAgIGRiX25hbWU6ICdjb3VjaGJhc2UuZGInLFxufVxudmFyIGRhdGFiYXNlID0gbmV3IENvdWNoYmFzZShEQl9jb25maWcuZGJfbmFtZSk7XG5cbi8vIFByZS1kZWZpbmUgUXVlcmllc1xuZGF0YWJhc2UuY3JlYXRlVmlldygnZnJpZW5kcycsICcxJywgKGRvY3VtZW50LCBlbWl0dGVyKSA9PiB7XG4gICAgaWYgKGRvY3VtZW50LmRvY3VtZW50VHlwZSA9PT0gJ0ZyaWVuZCcpIHtcbiAgICAgICAgZW1pdHRlci5lbWl0KGRvY3VtZW50LnRpbWVMYXN0TWVzc2FnZSwgZG9jdW1lbnQpOyAgICAgLy8gY2FsbCBiYWNrIHdpdGggdGhpcyBkb2N1bWVudDtcbiAgICB9O1xufSk7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gVXRpbGl0eSBmdW5jdGlvbnMgZXhwb3NlZCB0byBhbGwgb3RoZXIgVmlld3MsIHdoaWNoIGFic3RyYWN0IGF3YXkgY29tcGxldGVseSBmcm9tIHRoZSBEQiBiYWNrZW5kLiBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIEdlbmVyYWwgQXBwIGRldGFpbHMgZGF0YSBhbmQgRGF0YWJhc2UgaW5pdGFsaXNhdGlvblxuXG52YXIgYXBwRG9jdW1lbnRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBcHBEYXRhQWxyZWFkeUluaXRpYWxpc2VkKCk6IEJvb2xlYW4ge1xuICAgIGlmIChhcHBEb2N1bWVudFJlZikgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgY2xhc3MgQXBwRGF0YSB7XG5cbiAgICBwcml2YXRlIGZpcmViYXNlSW5pdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgdG9rZW46IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBmaXJlYmFzZS5pbml0KHtcblxuICAgICAgICAgICAgICAgIG9uTWVzc2FnZVJlY2VpdmVkQ2FsbGJhY2s6IGZ1bmN0aW9uIChub3RpZmljYXRpb246IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm90aWZpY2F0aW9uLm1lc3NhZ2VUb0ZldGNoUmVmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRyaWV2ZU1lc3NhZ2Uobm90aWZpY2F0aW9uLnRhcmdldFVzZXIsIG5vdGlmaWNhdGlvbi5tZXNzYWdlVG9GZXRjaFJlZilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihzZW5kZXIgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0TmV3TWVzc2FnZShzZW5kZXIubmlja25hbWUsIHNlbmRlci5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobm90aWZpY2F0aW9uLm15RGV0YWlscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlQWRkRnJpZW5kTm90aWZpY2F0aW9uKG5vdGlmaWNhdGlvbi5ub3RpZmljYXRpb25JZCwgbm90aWZpY2F0aW9uLm15RGV0YWlscyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgb25QdXNoVG9rZW5SZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0b2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0QXBwRGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuICAgICAgICAgICAgICAgIGZpcmViYXNlLmxvZ2luKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlyZWJhc2UuTG9naW5UeXBlLlBBU1NXT1JELFxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5wYXNzd29yZFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHVzZXIgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvcjogJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIEluaXRpYWxpc2VkIScpOyAgICAgICAgICAgLy8gZG8gbm90IHdhaXQgZm9yIGZpcmViYXNlIC0gdXNlciBzaG91bGQgYmUgYWJsZSB0byBzZWUgbG9jYWwgZGF0YVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdlbmVyYXRlUmFuZG9tRmlyZWJhc2VVc2VyKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgICAgICB0aGlzLmZpcmViYXNlSW5pdCgpLnRoZW4oZmlyZWJhc2VNZXNzYWdpbmdUb2tlbiA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbUVtYWlsID0gZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnQCcgKyBnZXRSYW5kb21pc2hTdHJpbmcoKSArICcuY29tJztcbiAgICAgICAgICAgICAgICB2YXIgcmFuZG9tUGFzc3dvcmQgPSBnZXRSYW5kb21pc2hTdHJpbmcoKSArIGdldFJhbmRvbWlzaFN0cmluZygpO1xuXG4gICAgICAgICAgICAgICAgZmlyZWJhc2UuY3JlYXRlVXNlcih7XG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkXG4gICAgICAgICAgICAgICAgfSkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZVVJRDogdXNlci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogcmFuZG9tRW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogcmFuZG9tUGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuOiBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byByZWdpc3RlciBBbm9ueW1vdXMgaWRlbnRpdHkgb24gcmVtb3RlIHNlcnZlcnMgJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2F2ZVJhbmRvbVVzZXJMb2NhbGx5KHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KHtcbiAgICAgICAgICAgICAgICBhcHBOYW1lOiAnU3F1ZWFrJyxcbiAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICBhdmF0YXJQYXRoOiAnfi9pbWFnZXMvYXZhdGFyLnBuZycsXG4gICAgICAgICAgICAgICAgICAgIG5pY2tuYW1lOiAnU3F1ZWFrJyxcbiAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2VVSUQ6IHVzZXIuZmlyZWJhc2VVSUQsXG4gICAgICAgICAgICAgICAgICAgIGZjbU1lc3NhZ2luZ1Rva2VuOiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW4sXG4gICAgICAgICAgICAgICAgICAgIHJhbmRvbUlkZW50aXR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB1c2VyLnBhc3N3b3JkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAnc3F1ZWFrLWFwcCcpO1xuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgdXNlclVJRDogdXNlci5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuOiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlRmlyZWJhc2VSZWNvcmRzKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZpcmViYXNlLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICcvdXNlcnMvJyArIHVzZXIudXNlclVJRCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGs6ICcnLFxuICAgICAgICAgICAgICAgICAgICB0OiB1c2VyLmZpcmViYXNlTWVzc2FnaW5nVG9rZW4sXG4gICAgICAgICAgICAgICAgICAgIHg6IFtdLFxuICAgICAgICAgICAgICAgICAgICB6OiBbXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIERhdGEgaW5pdGlhbGlzZWQuJyk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byBzZXQgVXNlciBkZXRhaWxzIG9uIHJlbW90ZSBzZXJ2ZXJzICcgKyBlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5cbi8vIExvY2FsIGFjY291bnQgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBmZXRjaExvY2FsQWNjb3VudERldGFpbHMoKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVMb2NhbE5pY2tuYW1lKG5pY2tuYW1lKSB7XG4gICAgdmFyIGxvY2FsU2V0dGluZ3NEb2N1bWVudCA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG4gICAgbG9jYWxTZXR0aW5nc0RvY3VtZW50LnNldHRpbmdzLm5pY2tuYW1lID0gbmlja25hbWU7XG4gICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoJ3NxdWVhay1hcHAnLCBsb2NhbFNldHRpbmdzRG9jdW1lbnQpO1xufVxuXG5cbi8vIEZyaWVuZHMgTGlzdCByZWxhdGVkIGRhdGFcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZyaWVuZChmcmllbmRJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KGZyaWVuZElkKTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIGZyaWVuZHNMaXN0UXVlcnkgPSBkYXRhYmFzZS5leGVjdXRlUXVlcnkoJ2ZyaWVuZHMnKTtcbiAgICAgICAgaWYgKGZyaWVuZHNMaXN0UXVlcnkpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZnJpZW5kc0xpc3RRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoJ0NvdWxkIG5vdCBvYnRhaW4gTGlzdCBvZiBGcmllbmRzIGZyb20gRGF0YWJhc2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChmaXJlYmFzZUlkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBteVByb2ZpbGUgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpLnNldHRpbmdzO1xuICAgICAgICB2YXIgcGF0aCA9ICcvdXNlcnMvJyArIG15UHJvZmlsZS5maXJlYmFzZVVJRCArICcveCc7XG5cbiAgICAgICAgLy8gYWRkIHRoaXMgdXNlciBjb2RlIC8gZmlyZWJhc2UgSWQgdG8gdGhlIGxpc3Qgb2YgcGVvcGxlIHdobyBjYW4gbWVzc2FnZSBtZVxuICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgIGZpcmViYXNlSWRcbiAgICAgICAgKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgLy8gbm90aWZ5IGZyaWVuZCB3aXRoIG91ciBvd24gZGV0YWlsc1xuICAgICAgICAgICAgdmFyIGVuY3J5cHRlZE15RGV0YWlscyA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAvLyB0byBiZSBlbmNyeXB0ZWRcbiAgICAgICAgICAgICAgICBuaWNrbmFtZTogbXlQcm9maWxlLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgIGZpcmViYXNlSWQ6IG15UHJvZmlsZS5maXJlYmFzZVVJRFxuICAgICAgICAgICAgICAgIC8vIGF2YXRhcjpcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICAgICAnbm90aWZpY2F0aW9ucycsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRVc2VyOiBmaXJlYmFzZUlkLFxuICAgICAgICAgICAgICAgICAgICBteURldGFpbHM6IGVuY3J5cHRlZE15RGV0YWlsc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAvLyAgIFNldCBwcmVsaW1pbmFyeSBkZXRhaWxzIGRldGFpbHMgZm9yIGZyaWVuZFxuICAgICAgICAgICAgICAgIHZhciBuZXdGcmllbmQgPSBuZXcgRnJpZW5kKGZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgIG5ld0ZyaWVuZC5sYXN0TWVzc2FnZVByZXZpZXcgPSAnV2FpdGluZyBmb3IgZnJpZW5kIGNvbmZpcm1hdGlvbi4uLic7XG4gICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQobmV3RnJpZW5kLCBmaXJlYmFzZUlkKTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FkZGVkIE5ldyBGcmllbmQnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciByZW1vdmVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgZGF0YWJhc2UuZGVsZXRlRG9jdW1lbnQodGFyZ2V0SWQpO1xuXG4gICAgICAgIHJlc29sdmUoJ1JlbW92ZWQgRnJpZW5kJyk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgdXBkYXRlRnJpZW5kID0gZnVuY3Rpb24gKHRhcmdldElkOiBzdHJpbmcsIG5ld1Byb3BlcnRpZXM6IE9iamVjdCk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQodGFyZ2V0SWQsIG5ld1Byb3BlcnRpZXMpO1xuXG4gICAgICAgIHJlc29sdmUoJ0VkaXRlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlQWRkRnJpZW5kTm90aWZpY2F0aW9uKG5vdGlmaWNhdGlvbklkLCBlbmNyeXB0ZWRGcmllbmREZXRhaWxzKSB7XG5cbiAgICB2YXIgZnJpZW5kID0gSlNPTi5wYXJzZShlbmNyeXB0ZWRGcmllbmREZXRhaWxzKTtcblxuICAgIHZhciBsb2NhbEZyaWVuZFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KGZyaWVuZC5maXJlYmFzZUlkKTtcblxuICAgIC8vIGlmIHdlIGFscmVhZHkgaGF2ZSBhIHJlY29yZCBmb3IgdGhhdCBmcmllbmQgKGkuZS4gdGhleSBnYXZlIHVzIHRoZSBjb2RlKSwgdXBkYXRlIHRoZSBGcmllbmQgcmVjb3JkXG4gICAgaWYgKGxvY2FsRnJpZW5kUmVmKSB7XG4gICAgICAgIGxvY2FsRnJpZW5kUmVmLm5pY2tuYW1lID0gZnJpZW5kLm5pY2tuYW1lO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCwgbG9jYWxGcmllbmRSZWYpO1xuXG4gICAgICAgIG5vdGlmaWNhdGlvblNlcnZpY2UuYWxlcnRGcmllbmRDb25maXJtYXRpb24oZnJpZW5kLm5pY2tuYW1lKTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIGlmIHdlIGRvIG5vdCBoYXZlIGEgcmVjb3JkIGZvciB0aGF0IGZyaWVuZCAoaS5lLiB3ZSBnYXZlIHRoZW0gdGhlIGNvZGUpLCByZXF1ZXN0IHBlcm1pc3Npb24gdG8gYWRkIHRoZW0gdG8gb3VyIGZyaWVuZHMgbGlzdFxuICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kUmVxdWVzdChmcmllbmQubmlja25hbWUpXG4gICAgICAgICAgICAudGhlbihjb25maXJtYXRpb24gPT4ge1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgd2UgcmVjZWl2ZSBhIHRydWUgdmFsdWUgKD09IGFjY2VwdCkgZnJvbSB0aGUgUHJvbWlzZVxuICAgICAgICAgICAgICAgIGlmIChjb25maXJtYXRpb24pIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgRnJpZW5kIHJlY29yZFxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RnJpZW5kID0gbmV3IEZyaWVuZChmcmllbmQubmlja25hbWUpO1xuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudChuZXdGcmllbmQsIGZyaWVuZC5maXJlYmFzZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZENvbmZpcm1hdGlvbihmcmllbmQubmlja25hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZERvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoY2hhdElkKTtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc3RvcmUgdGhlIG1lc3NhZ2UgaW4gbWVtb3J5ICAgICAgICBcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnU2VuZGluZy4uLic7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlSW5kZXggPSBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcblxuICAgICAgICAvLyBwdXNoIG1lc3NhZ2UgdG8gZmlyZWJhc2VcbiAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICcvdXNlcnMvJyArIG5ld0ZyaWVuZERvY3VtZW50Ll9pZCArICcveicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUF1dGhvcjogZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5zZXR0aW5ncy5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlVGV4dDogbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlVGltZVNlbnQ6IGZpcmViYXNlLlNlcnZlclZhbHVlLlRJTUVTVEFNUFxuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgICAgICAvLyB0aGVuIHB1c2ggbm90aWZpY2F0aW9uIG9mIHRoZSBtZXNzYWdlIHNlbnQgICAgXG4gICAgICAgICAgICAudGhlbihwdXNoUmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbnRNZXNzYWdlUmVmID0gcHVzaFJlc3BvbnNlLmtleTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAnbm90aWZpY2F0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VUb0ZldGNoUmVmOiBzZW50TWVzc2FnZVJlZixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFVzZXI6IG5ld0ZyaWVuZERvY3VtZW50Ll9pZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vdGhlbiB1cGRhdGUgdGhlIGxvY2FsIHN0YXRlICAgIFxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJTZW50XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ01lc3NhZ2UgU2VudCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJGYWlsZWRcIjtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxudmFyIHJldHJpZXZlTWVzc2FnZSA9IGZ1bmN0aW9uICh0YXJnZXRVc2VyOiBzdHJpbmcsIG1lc3NhZ2VSZWY6IHN0cmluZyk6IFByb21pc2U8eyBpZDogc3RyaW5nLCBuaWNrbmFtZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgbXlNZXNzYWdlUGF0aCA9ICd1c2Vycy8nICsgdGFyZ2V0VXNlciArICcvei8nICsgbWVzc2FnZVJlZjtcbiAgICAgICAgZmlyZWJhc2UuYWRkVmFsdWVFdmVudExpc3RlbmVyKHNuYXBzaG90ID0+IHtcbiAgICAgICAgICAgIC8vIG9ubHkgZ2V0IGV4Y2l0ZWQgd2hlbiB0aGluZ3MgYXJlIEFkZGVkIHRvIHRoZSBQYXRoLCBub3QgYWxzbyBvbiB0aGUgUmVtb3ZlIGV2ZW50IHdoaWNoIGlzIHRyaWdnZXJlZCBsYXRlci4gICAgICBcbiAgICAgICAgICAgIGlmIChzbmFwc2hvdC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciByZWNlaXZlZCA9IHNuYXBzaG90LnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIG5ldyBNZXNzYWdlKCkgZm9yIGxvY2FsIGNvbnN1bXB0aW9uXG4gICAgICAgICAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZSgnJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRleHQgPSByZWNlaXZlZC5tZXNzYWdlVGV4dDtcbiAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKHJlY2VpdmVkLm1lc3NhZ2VUaW1lU2VudCk7XG4gICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkID0gbmV3IERhdGUoKTtcblxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRGcmllbmQgPSBnZXRGcmllbmQocmVjZWl2ZWQubWVzc2FnZUF1dGhvcik7XG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnRpbWVMYXN0TWVzc2FnZSA9IG5ld01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQubGFzdE1lc3NhZ2VQcmV2aWV3ID0gcmVjZWl2ZWQubWVzc2FnZVRleHQ7ICAgICAgICAgICAgIC8vIHRoaXMgY291bGQgYmUgdHJpbW1lZCBvciBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQudW5yZWFkTWVzc2FnZXNOdW1iZXIgKz0gMTtcblxuICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KHJlY2VpdmVkLm1lc3NhZ2VBdXRob3IsIHRhcmdldEZyaWVuZCk7XG4gICAgICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUobXlNZXNzYWdlUGF0aCwgbnVsbCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJlY2VpdmVkLm1lc3NhZ2VBdXRob3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogdGFyZ2V0RnJpZW5kLm5pY2tuYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBteU1lc3NhZ2VQYXRoKVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuXG4vLyBSYW5kb20gdXRpbGl0eSBmdW5jdGlvbnNcblxuZnVuY3Rpb24gZ2V0UmFuZG9taXNoU3RyaW5nKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcbn0iXX0=