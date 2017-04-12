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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUNuRCxvREFBc0Q7QUFFdEQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRWhELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSEQsd0VBR0M7QUFFRDtJQUFBO1FBRVksaUJBQVksR0FBRztZQUNu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VSxDQUFDLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxlQUFlLEdBQUcsVUFBVSxDQUFDLG1CQUFtQixDQUFDO2dCQUM5RCxZQUFZLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFhLHFDQUFxQztnQkFDekcsWUFBWSxDQUFDLG9CQUFvQixJQUFJLENBQUMsQ0FBQztnQkFFdkMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUM5RCxRQUFRLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ3hDLE9BQU8sQ0FBQzt3QkFDSixFQUFFLEVBQUUsUUFBUSxDQUFDLGFBQWE7d0JBQzFCLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUTtxQkFDbEMsQ0FBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztRQUNMLENBQUMsRUFBRSxhQUFhLENBQUM7YUFDWixLQUFLLENBQUMsVUFBQSxLQUFLO1lBQ1IsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2IsTUFBTSxFQUFFLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBR0QsMkJBQTJCO0FBRTNCO0lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmaXJlYmFzZSBmcm9tICduYXRpdmVzY3JpcHQtcGx1Z2luLWZpcmViYXNlJztcbmltcG9ydCB7IENvdWNoYmFzZSB9IGZyb20gJ25hdGl2ZXNjcmlwdC1jb3VjaGJhc2UnO1xuXG5pbXBvcnQgeyBGcmllbmQsIE1lc3NhZ2UgfSBmcm9tICcuL2FwcC1kYXRhLW1vZGVsJztcbmltcG9ydCAqIGFzIG5vdGlmaWNhdGlvblNlcnZpY2UgZnJvbSAnLi9ub3RpZmljYXRpb24nO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gQVBJOlxuLy8gXG4vLyBpbml0RnJpZW5kc0RhdGEoKS50aGVuKDxkbyBzdHVmZj4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gaW5pdGFsaXNlcyB0aGUgRGF0YWJhc2UgYW5kIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIGdldEZyaWVuZHNMaXN0KCkudGhlbiggZnJpZW5kc0xpc3QgPT4geyA8ZG8gc3R1ZmYgd2l0aCBmcmllbmRzTGlzdCBBcnJheT4gfSApICAgICAgICAtLSBnZXRzIHRoZSBmcmllbmRzTGlzdCBhcyBhbiBBcnJheVxuLy8gYWRkRnJpZW5kKDxmcmllbmQgbmlja25hbWU+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gcmVtb3ZlRnJpZW5kKDxmcmllbmQgX2lkPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gdXBkYXRlRnJpZW5kKDxmcmllbmQgX2lkPiwgPG5ldyBkYXRhIGNvbnRlbnQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIENvdWNoYmFzZSBpbml0aWFsIGNvbmZpZ3VyYXRpb25cbmNvbnN0IERCX2NvbmZpZyA9IHtcbiAgICBkYl9uYW1lOiAnY291Y2hiYXNlLmRiJyxcbn1cbnZhciBkYXRhYmFzZSA9IG5ldyBDb3VjaGJhc2UoREJfY29uZmlnLmRiX25hbWUpO1xuXG4vLyBQcmUtZGVmaW5lIFF1ZXJpZXNcbmRhdGFiYXNlLmNyZWF0ZVZpZXcoJ2ZyaWVuZHMnLCAnMScsIChkb2N1bWVudCwgZW1pdHRlcikgPT4ge1xuICAgIGlmIChkb2N1bWVudC5kb2N1bWVudFR5cGUgPT09ICdGcmllbmQnKSB7XG4gICAgICAgIGVtaXR0ZXIuZW1pdChkb2N1bWVudC50aW1lTGFzdE1lc3NhZ2UsIGRvY3VtZW50KTsgICAgIC8vIGNhbGwgYmFjayB3aXRoIHRoaXMgZG9jdW1lbnQ7XG4gICAgfTtcbn0pO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGV4cG9zZWQgdG8gYWxsIG90aGVyIFZpZXdzLCB3aGljaCBhYnN0cmFjdCBhd2F5IGNvbXBsZXRlbHkgZnJvbSB0aGUgREIgYmFja2VuZC4gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBHZW5lcmFsIEFwcCBkZXRhaWxzIGRhdGEgYW5kIERhdGFiYXNlIGluaXRhbGlzYXRpb25cblxudmFyIGFwcERvY3VtZW50UmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQXBwRGF0YUFscmVhZHlJbml0aWFsaXNlZCgpOiBCb29sZWFuIHtcbiAgICBpZiAoYXBwRG9jdW1lbnRSZWYpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGNsYXNzIEFwcERhdGEge1xuXG4gICAgcHJpdmF0ZSBmaXJlYmFzZUluaXQgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IHRva2VuOiBzdHJpbmcgfT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZmlyZWJhc2UuaW5pdCh7XG5cbiAgICAgICAgICAgICAgICBvbk1lc3NhZ2VSZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAobm90aWZpY2F0aW9uOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGlmaWNhdGlvbi5tZXNzYWdlVG9GZXRjaFJlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0cmlldmVNZXNzYWdlKG5vdGlmaWNhdGlvbi50YXJnZXRVc2VyLCBub3RpZmljYXRpb24ubWVzc2FnZVRvRmV0Y2hSZWYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oc2VuZGVyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydE5ld01lc3NhZ2Uoc2VuZGVyLm5pY2tuYW1lLCBzZW5kZXIuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGlmaWNhdGlvbi5teURldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUFkZEZyaWVuZE5vdGlmaWNhdGlvbihub3RpZmljYXRpb24ubm90aWZpY2F0aW9uSWQsIG5vdGlmaWNhdGlvbi5teURldGFpbHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIG9uUHVzaFRva2VuUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGFydEFwcERhdGEoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuZmlyZWJhc2VJbml0KCkudGhlbihmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuID0+IHtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5sb2dpbih7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpcmViYXNlLkxvZ2luVHlwZS5QQVNTV09SRCxcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IGFwcERvY3VtZW50UmVmLnNldHRpbmdzLnJhbmRvbUlkZW50aXR5LmVtYWlsLFxuICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkucGFzc3dvcmRcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbih1c2VyID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3I6ICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBJbml0aWFsaXNlZCEnKTsgICAgICAgICAgIC8vIGRvIG5vdCB3YWl0IGZvciBmaXJlYmFzZSAtIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gc2VlIGxvY2FsIGRhdGFcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZW5lcmF0ZVJhbmRvbUZpcmViYXNlVXNlcigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgZGF0YWJhc2UuZGVsZXRlRG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuICAgICAgICAgICAgICAgIHZhciByYW5kb21FbWFpbCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgJ0AnICsgZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnLmNvbSc7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVBhc3N3b3JkID0gZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyBnZXRSYW5kb21pc2hTdHJpbmcoKTtcblxuICAgICAgICAgICAgICAgIGZpcmViYXNlLmNyZWF0ZVVzZXIoe1xuICAgICAgICAgICAgICAgICAgICBlbWFpbDogcmFuZG9tRW1haWwsXG4gICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZFxuICAgICAgICAgICAgICAgIH0pLnRoZW4odXNlciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2VVSUQ6IHVzZXIua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHJhbmRvbUVtYWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2VNZXNzYWdpbmdUb2tlbjogZmlyZWJhc2VNZXNzYWdpbmdUb2tlblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gcmVnaXN0ZXIgQW5vbnltb3VzIGlkZW50aXR5IG9uIHJlbW90ZSBzZXJ2ZXJzICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNhdmVSYW5kb21Vc2VyTG9jYWxseSh1c2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudCh7XG4gICAgICAgICAgICAgICAgYXBwTmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyUGF0aDogJ34vaW1hZ2VzL2F2YXRhci5wbmcnLFxuICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgICAgICAgICBmY21NZXNzYWdpbmdUb2tlbjogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICByYW5kb21JZGVudGl0eToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogdXNlci5wYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgJ3NxdWVhay1hcHAnKTtcbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgIHVzZXJVSUQ6IHVzZXIuZmlyZWJhc2VVSUQsXG4gICAgICAgICAgICAgICAgZmlyZWJhc2VNZXNzYWdpbmdUb2tlbjogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZUZpcmViYXNlUmVjb3Jkcyh1c2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAnL3VzZXJzLycgKyB1c2VyLnVzZXJVSUQsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBrOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgdDogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICB4OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgejogW11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGluaXRpYWxpc2VkLicpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gc2V0IFVzZXIgZGV0YWlscyBvbiByZW1vdGUgc2VydmVycyAnICsgZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuXG4vLyBMb2NhbCBhY2NvdW50IHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hMb2NhbEFjY291bnREZXRhaWxzKCkge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlTG9jYWxOaWNrbmFtZShuaWNrbmFtZSkge1xuICAgIHZhciBsb2NhbFNldHRpbmdzRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuICAgIGxvY2FsU2V0dGluZ3NEb2N1bWVudC5zZXR0aW5ncy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KCdzcXVlYWstYXBwJywgbG9jYWxTZXR0aW5nc0RvY3VtZW50KTtcbn1cblxuXG4vLyBGcmllbmRzIExpc3QgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGcmllbmQoZnJpZW5kSWQ6IHN0cmluZykge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmRJZCk7XG59XG5cbmV4cG9ydCB2YXIgZ2V0RnJpZW5kc0xpc3QgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IGZyaWVuZHNMaXN0OiBBcnJheTxPYmplY3Q+IH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBmcmllbmRzTGlzdFF1ZXJ5ID0gZGF0YWJhc2UuZXhlY3V0ZVF1ZXJ5KCdmcmllbmRzJyk7XG4gICAgICAgIGlmIChmcmllbmRzTGlzdFF1ZXJ5KSB7XG4gICAgICAgICAgICByZXNvbHZlKGZyaWVuZHNMaXN0UXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KCdDb3VsZCBub3Qgb2J0YWluIExpc3Qgb2YgRnJpZW5kcyBmcm9tIERhdGFiYXNlJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBhZGRGcmllbmQgPSBmdW5jdGlvbiAoZmlyZWJhc2VJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgbXlQcm9maWxlID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5zZXR0aW5ncztcbiAgICAgICAgdmFyIHBhdGggPSAnL3VzZXJzLycgKyBteVByb2ZpbGUuZmlyZWJhc2VVSUQgKyAnL3gnO1xuXG4gICAgICAgIC8vIGFkZCB0aGlzIHVzZXIgY29kZSAvIGZpcmViYXNlIElkIHRvIHRoZSBsaXN0IG9mIHBlb3BsZSB3aG8gY2FuIG1lc3NhZ2UgbWVcbiAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICBmaXJlYmFzZUlkXG4gICAgICAgICkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIG5vdGlmeSBmcmllbmQgd2l0aCBvdXIgb3duIGRldGFpbHNcbiAgICAgICAgICAgIHZhciBlbmNyeXB0ZWRNeURldGFpbHMgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgLy8gdG8gYmUgZW5jcnlwdGVkXG4gICAgICAgICAgICAgICAgbmlja25hbWU6IG15UHJvZmlsZS5uaWNrbmFtZSxcbiAgICAgICAgICAgICAgICBmaXJlYmFzZUlkOiBteVByb2ZpbGUuZmlyZWJhc2VVSURcbiAgICAgICAgICAgICAgICAvLyBhdmF0YXI6XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICAgICAnbm90aWZpY2F0aW9ucycsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRVc2VyOiBmaXJlYmFzZUlkLFxuICAgICAgICAgICAgICAgICAgICBteURldGFpbHM6IGVuY3J5cHRlZE15RGV0YWlsc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB2YXIgZnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZmlyZWJhc2VJZCk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBmcmllbmRSZWYgZG9lcyBub3QgZXhpc3QsIGluaXRpYWxpc2UgdGVtcG9yYXJ5IHZhbHVlc1xuICAgICAgICAgICAgICAgIGlmICghZnJpZW5kUmVmKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gICBTZXQgcHJlbGltaW5hcnkgZGV0YWlscyBkZXRhaWxzIGZvciBmcmllbmRcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0ZyaWVuZCA9IG5ldyBGcmllbmQoJ1BlbmRpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3RnJpZW5kLmxhc3RNZXNzYWdlUHJldmlldyA9ICdXYWl0aW5nIGZvciBmcmllbmQgY29uZmlybWF0aW9uLi4uIChjb2RlOiAnICsgZmlyZWJhc2VJZCArICcpJztcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQobmV3RnJpZW5kLCBmaXJlYmFzZUlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgnQWRkZWQgTmV3IEZyaWVuZCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVBZGRGcmllbmROb3RpZmljYXRpb24obm90aWZpY2F0aW9uSWQsIGVuY3J5cHRlZEZyaWVuZERldGFpbHMpIHtcblxuICAgIHZhciBmcmllbmQgPSBKU09OLnBhcnNlKGVuY3J5cHRlZEZyaWVuZERldGFpbHMpO1xuXG4gICAgbGV0IGxvY2FsRnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQpO1xuXG4gICAgLy8gaWYgd2UgYWxyZWFkeSBoYXZlIGEgcmVjb3JkIGZvciB0aGF0IGZyaWVuZCAoaS5lLiB0aGV5IGdhdmUgdXMgdGhlIGNvZGUpLCB1cGRhdGUgdGhlIEZyaWVuZCByZWNvcmRcbiAgICBpZiAobG9jYWxGcmllbmRSZWYpIHtcbiAgICAgICAgbG9jYWxGcmllbmRSZWYubmlja25hbWUgPSBmcmllbmQubmlja25hbWU7XG4gICAgICAgIGxvY2FsRnJpZW5kUmVmLmxhc3RNZXNzYWdlUHJldmlldyA9ICdOZXcgRnJpZW5kJztcbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQsIGxvY2FsRnJpZW5kUmVmKTtcblxuICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kQ29uZmlybWF0aW9uKGZyaWVuZC5uaWNrbmFtZSk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgICAvLyBpZiB3ZSBkbyBub3QgaGF2ZSBhIHJlY29yZCBmb3IgdGhhdCBmcmllbmQgKGkuZS4gd2UgZ2F2ZSB0aGVtIHRoZSBjb2RlKSwgcmVxdWVzdCBwZXJtaXNzaW9uIHRvIGFkZCB0aGVtIHRvIG91ciBmcmllbmRzIGxpc3RcbiAgICAgICAgbm90aWZpY2F0aW9uU2VydmljZS5hbGVydEZyaWVuZFJlcXVlc3QoZnJpZW5kLm5pY2tuYW1lKVxuICAgICAgICAgICAgLnRoZW4oY29uZmlybWF0aW9uID0+IHtcbiAgICAgICAgICAgICAgICAvLyBpZiB3ZSByZWNlaXZlIGEgdHJ1ZSB2YWx1ZSAoPT0gYWNjZXB0KSBmcm9tIHRoZSBQcm9taXNlXG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpcm1hdGlvbikge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCBGcmllbmQgcmVjb3JkIHdpdGggaW5pdGlhbCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgYWRkRnJpZW5kKGZyaWVuZC5maXJlYmFzZUlkKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlbiB1cGRhdGUgd2l0aCB0aGUgYWN0dWFsIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvY2FsRnJpZW5kUmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kLmZpcmViYXNlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxGcmllbmRSZWYubmlja25hbWUgPSBmcmllbmQubmlja25hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbEZyaWVuZFJlZi5sYXN0TWVzc2FnZVByZXZpZXcgPSAnTmV3IEZyaWVuZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChmcmllbmQuZmlyZWJhc2VJZCwgbG9jYWxGcmllbmRSZWYpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0RnJpZW5kQ29uZmlybWF0aW9uKGZyaWVuZC5uaWNrbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnUmVtb3ZlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciB1cGRhdGVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZERvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoY2hhdElkKTtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc3RvcmUgdGhlIG1lc3NhZ2UgaW4gbWVtb3J5ICAgICAgICBcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnU2VuZGluZy4uLic7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlSW5kZXggPSBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcblxuICAgICAgICAvLyBwdXNoIG1lc3NhZ2UgdG8gZmlyZWJhc2VcbiAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICcvdXNlcnMvJyArIG5ld0ZyaWVuZERvY3VtZW50Ll9pZCArICcveicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUF1dGhvcjogZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5zZXR0aW5ncy5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlVGV4dDogbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlVGltZVNlbnQ6IGZpcmViYXNlLlNlcnZlclZhbHVlLlRJTUVTVEFNUFxuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgICAgICAvLyB0aGVuIHB1c2ggbm90aWZpY2F0aW9uIG9mIHRoZSBtZXNzYWdlIHNlbnQgICAgXG4gICAgICAgICAgICAudGhlbihwdXNoUmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbnRNZXNzYWdlUmVmID0gcHVzaFJlc3BvbnNlLmtleTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAnbm90aWZpY2F0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VUb0ZldGNoUmVmOiBzZW50TWVzc2FnZVJlZixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFVzZXI6IG5ld0ZyaWVuZERvY3VtZW50Ll9pZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vdGhlbiB1cGRhdGUgdGhlIGxvY2FsIHN0YXRlICAgIFxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJTZW50XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ01lc3NhZ2UgU2VudCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJGYWlsZWRcIjtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxudmFyIHJldHJpZXZlTWVzc2FnZSA9IGZ1bmN0aW9uICh0YXJnZXRVc2VyOiBzdHJpbmcsIG1lc3NhZ2VSZWY6IHN0cmluZyk6IFByb21pc2U8eyBpZDogc3RyaW5nLCBuaWNrbmFtZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgbXlNZXNzYWdlUGF0aCA9ICd1c2Vycy8nICsgdGFyZ2V0VXNlciArICcvei8nICsgbWVzc2FnZVJlZjtcbiAgICAgICAgZmlyZWJhc2UuYWRkVmFsdWVFdmVudExpc3RlbmVyKHNuYXBzaG90ID0+IHtcbiAgICAgICAgICAgIC8vIG9ubHkgZ2V0IGV4Y2l0ZWQgd2hlbiB0aGluZ3MgYXJlIEFkZGVkIHRvIHRoZSBQYXRoLCBub3QgYWxzbyBvbiB0aGUgUmVtb3ZlIGV2ZW50IHdoaWNoIGlzIHRyaWdnZXJlZCBsYXRlci4gICAgICBcbiAgICAgICAgICAgIGlmIChzbmFwc2hvdC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciByZWNlaXZlZCA9IHNuYXBzaG90LnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIG5ldyBNZXNzYWdlKCkgZm9yIGxvY2FsIGNvbnN1bXB0aW9uXG4gICAgICAgICAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZSgnJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRleHQgPSByZWNlaXZlZC5tZXNzYWdlVGV4dDtcbiAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKHJlY2VpdmVkLm1lc3NhZ2VUaW1lU2VudCk7XG4gICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkID0gbmV3IERhdGUoKTtcblxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRGcmllbmQgPSBnZXRGcmllbmQocmVjZWl2ZWQubWVzc2FnZUF1dGhvcik7XG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnRpbWVMYXN0TWVzc2FnZSA9IG5ld01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZDtcbiAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQubGFzdE1lc3NhZ2VQcmV2aWV3ID0gcmVjZWl2ZWQubWVzc2FnZVRleHQ7ICAgICAgICAgICAgIC8vIHRoaXMgY291bGQgYmUgdHJpbW1lZCBvciBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQudW5yZWFkTWVzc2FnZXNOdW1iZXIgKz0gMTtcblxuICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KHJlY2VpdmVkLm1lc3NhZ2VBdXRob3IsIHRhcmdldEZyaWVuZCk7XG4gICAgICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUobXlNZXNzYWdlUGF0aCwgbnVsbCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHJlY2VpdmVkLm1lc3NhZ2VBdXRob3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogdGFyZ2V0RnJpZW5kLm5pY2tuYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBteU1lc3NhZ2VQYXRoKVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuXG4vLyBSYW5kb20gdXRpbGl0eSBmdW5jdGlvbnNcblxuZnVuY3Rpb24gZ2V0UmFuZG9taXNoU3RyaW5nKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcbn0iXX0=