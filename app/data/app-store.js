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
                    onMessageReceivedCallback: function (message) {
                        retrieveMessage(message.targetUser, message.messageToFetchRef)
                            .then(function (sender) {
                            notificationService.alertNow(sender.nickname, sender.id);
                        });
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
exports.addFriend = function (nickname) {
    return new Promise(function (resolve, reject) {
        var newFriend = new app_data_model_1.Friend(nickname);
        database.createDocument(newFriend, 'DEqo7u1tMMgkG2dUwI72DIjveKf2');
        resolve('Added New Friend');
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
                messageRef: sentMessageRef,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUNuRCxvREFBc0Q7QUFFdEQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRWhELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFdEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RDtJQUNJLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBSEQsd0VBR0M7QUFFRDtJQUFBO1FBRVksaUJBQVksR0FBRztZQUNu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QUFDLFdBQVcsQ0FBQyxDQUFhLHFDQUFxQztnQkFDekcsWUFBWSxDQUFDLG9CQUFvQixJQUFJLENBQUMsQ0FBQztnQkFFdkMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUM5RCxRQUFRLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ3hDLE9BQU8sQ0FBQzt3QkFDSixFQUFFLEVBQUUsUUFBUSxDQUFDLGFBQWE7d0JBQzFCLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUTtxQkFDbEMsQ0FBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztRQUNMLENBQUMsRUFBRSxhQUFhLENBQUM7YUFDWixLQUFLLENBQUMsVUFBQSxLQUFLO1lBQ1IsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2IsTUFBTSxFQUFFLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztJQUNYLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBR0QsMkJBQTJCO0FBRTNCO0lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmaXJlYmFzZSBmcm9tICduYXRpdmVzY3JpcHQtcGx1Z2luLWZpcmViYXNlJztcbmltcG9ydCB7IENvdWNoYmFzZSB9IGZyb20gJ25hdGl2ZXNjcmlwdC1jb3VjaGJhc2UnO1xuXG5pbXBvcnQgeyBGcmllbmQsIE1lc3NhZ2UgfSBmcm9tICcuL2FwcC1kYXRhLW1vZGVsJztcbmltcG9ydCAqIGFzIG5vdGlmaWNhdGlvblNlcnZpY2UgZnJvbSAnLi9ub3RpZmljYXRpb24nO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gQVBJOlxuLy8gXG4vLyBpbml0RnJpZW5kc0RhdGEoKS50aGVuKDxkbyBzdHVmZj4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gaW5pdGFsaXNlcyB0aGUgRGF0YWJhc2UgYW5kIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIGdldEZyaWVuZHNMaXN0KCkudGhlbiggZnJpZW5kc0xpc3QgPT4geyA8ZG8gc3R1ZmYgd2l0aCBmcmllbmRzTGlzdCBBcnJheT4gfSApICAgICAgICAtLSBnZXRzIHRoZSBmcmllbmRzTGlzdCBhcyBhbiBBcnJheVxuLy8gYWRkRnJpZW5kKDxmcmllbmQgbmlja25hbWU+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gcmVtb3ZlRnJpZW5kKDxmcmllbmQgX2lkPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gdXBkYXRlRnJpZW5kKDxmcmllbmQgX2lkPiwgPG5ldyBkYXRhIGNvbnRlbnQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIENvdWNoYmFzZSBpbml0aWFsIGNvbmZpZ3VyYXRpb25cbmNvbnN0IERCX2NvbmZpZyA9IHtcbiAgICBkYl9uYW1lOiAnY291Y2hiYXNlLmRiJyxcbn1cbnZhciBkYXRhYmFzZSA9IG5ldyBDb3VjaGJhc2UoREJfY29uZmlnLmRiX25hbWUpO1xuXG4vLyBQcmUtZGVmaW5lIFF1ZXJpZXNcbmRhdGFiYXNlLmNyZWF0ZVZpZXcoJ2ZyaWVuZHMnLCAnMScsIChkb2N1bWVudCwgZW1pdHRlcikgPT4ge1xuICAgIGlmIChkb2N1bWVudC5kb2N1bWVudFR5cGUgPT09ICdGcmllbmQnKSB7XG4gICAgICAgIGVtaXR0ZXIuZW1pdChkb2N1bWVudC50aW1lTGFzdE1lc3NhZ2UsIGRvY3VtZW50KTsgICAgIC8vIGNhbGwgYmFjayB3aXRoIHRoaXMgZG9jdW1lbnQ7XG4gICAgfTtcbn0pO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGV4cG9zZWQgdG8gYWxsIG90aGVyIFZpZXdzLCB3aGljaCBhYnN0cmFjdCBhd2F5IGNvbXBsZXRlbHkgZnJvbSB0aGUgREIgYmFja2VuZC4gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBHZW5lcmFsIEFwcCBkZXRhaWxzIGRhdGEgYW5kIERhdGFiYXNlIGluaXRhbGlzYXRpb25cblxudmFyIGFwcERvY3VtZW50UmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQXBwRGF0YUFscmVhZHlJbml0aWFsaXNlZCgpOiBCb29sZWFuIHtcbiAgICBpZiAoYXBwRG9jdW1lbnRSZWYpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGNsYXNzIEFwcERhdGEge1xuXG4gICAgcHJpdmF0ZSBmaXJlYmFzZUluaXQgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IHRva2VuOiBzdHJpbmcgfT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZmlyZWJhc2UuaW5pdCh7XG5cbiAgICAgICAgICAgICAgICBvbk1lc3NhZ2VSZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAobWVzc2FnZTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHJpZXZlTWVzc2FnZShtZXNzYWdlLnRhcmdldFVzZXIsIG1lc3NhZ2UubWVzc2FnZVRvRmV0Y2hSZWYpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihzZW5kZXIgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblNlcnZpY2UuYWxlcnROb3coc2VuZGVyLm5pY2tuYW1lLCBzZW5kZXIuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIG9uUHVzaFRva2VuUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGFydEFwcERhdGEoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuZmlyZWJhc2VJbml0KCkudGhlbihmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuID0+IHtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5sb2dpbih7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpcmViYXNlLkxvZ2luVHlwZS5QQVNTV09SRCxcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IGFwcERvY3VtZW50UmVmLnNldHRpbmdzLnJhbmRvbUlkZW50aXR5LmVtYWlsLFxuICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkucGFzc3dvcmRcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbih1c2VyID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3I6ICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBJbml0aWFsaXNlZCEnKTsgICAgICAgICAgIC8vIGRvIG5vdCB3YWl0IGZvciBmaXJlYmFzZSAtIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gc2VlIGxvY2FsIGRhdGFcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZW5lcmF0ZVJhbmRvbUZpcmViYXNlVXNlcigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgZGF0YWJhc2UuZGVsZXRlRG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcblxuICAgICAgICAgICAgdGhpcy5maXJlYmFzZUluaXQoKS50aGVuKGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPT4ge1xuICAgICAgICAgICAgICAgIHZhciByYW5kb21FbWFpbCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgJ0AnICsgZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnLmNvbSc7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVBhc3N3b3JkID0gZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyBnZXRSYW5kb21pc2hTdHJpbmcoKTtcblxuICAgICAgICAgICAgICAgIGZpcmViYXNlLmNyZWF0ZVVzZXIoe1xuICAgICAgICAgICAgICAgICAgICBlbWFpbDogcmFuZG9tRW1haWwsXG4gICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZFxuICAgICAgICAgICAgICAgIH0pLnRoZW4odXNlciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2VVSUQ6IHVzZXIua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHJhbmRvbUVtYWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2VNZXNzYWdpbmdUb2tlbjogZmlyZWJhc2VNZXNzYWdpbmdUb2tlblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gcmVnaXN0ZXIgQW5vbnltb3VzIGlkZW50aXR5IG9uIHJlbW90ZSBzZXJ2ZXJzICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNhdmVSYW5kb21Vc2VyTG9jYWxseSh1c2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudCh7XG4gICAgICAgICAgICAgICAgYXBwTmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyUGF0aDogJ34vaW1hZ2VzL2F2YXRhci5wbmcnLFxuICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgICAgICAgICBmY21NZXNzYWdpbmdUb2tlbjogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICByYW5kb21JZGVudGl0eToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogdXNlci5wYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgJ3NxdWVhay1hcHAnKTtcbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgIHVzZXJVSUQ6IHVzZXIuZmlyZWJhc2VVSUQsXG4gICAgICAgICAgICAgICAgZmlyZWJhc2VNZXNzYWdpbmdUb2tlbjogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZUZpcmViYXNlUmVjb3Jkcyh1c2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAnL3VzZXJzLycgKyB1c2VyLnVzZXJVSUQsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBrOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgdDogdXNlci5maXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICB4OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgejogW11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGluaXRpYWxpc2VkLicpO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gc2V0IFVzZXIgZGV0YWlscyBvbiByZW1vdGUgc2VydmVycyAnICsgZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuXG4vLyBMb2NhbCBhY2NvdW50IHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hMb2NhbEFjY291bnREZXRhaWxzKCkge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlTG9jYWxOaWNrbmFtZShuaWNrbmFtZSkge1xuICAgIHZhciBsb2NhbFNldHRpbmdzRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuICAgIGxvY2FsU2V0dGluZ3NEb2N1bWVudC5zZXR0aW5ncy5uaWNrbmFtZSA9IG5pY2tuYW1lO1xuICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KCdzcXVlYWstYXBwJywgbG9jYWxTZXR0aW5nc0RvY3VtZW50KTtcbn1cblxuXG4vLyBGcmllbmRzIExpc3QgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGcmllbmQoZnJpZW5kSWQ6IHN0cmluZykge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmRJZCk7XG59XG5cbmV4cG9ydCB2YXIgZ2V0RnJpZW5kc0xpc3QgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IGZyaWVuZHNMaXN0OiBBcnJheTxPYmplY3Q+IH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBmcmllbmRzTGlzdFF1ZXJ5ID0gZGF0YWJhc2UuZXhlY3V0ZVF1ZXJ5KCdmcmllbmRzJyk7XG4gICAgICAgIGlmIChmcmllbmRzTGlzdFF1ZXJ5KSB7XG4gICAgICAgICAgICByZXNvbHZlKGZyaWVuZHNMaXN0UXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KCdDb3VsZCBub3Qgb2J0YWluIExpc3Qgb2YgRnJpZW5kcyBmcm9tIERhdGFiYXNlJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBhZGRGcmllbmQgPSBmdW5jdGlvbiAobmlja25hbWU6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG5ld0ZyaWVuZCA9IG5ldyBGcmllbmQobmlja25hbWUpO1xuICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudChuZXdGcmllbmQsICdERXFvN3UxdE1NZ2tHMmRVd0k3MkRJanZlS2YyJyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnQWRkZWQgTmV3IEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnUmVtb3ZlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciB1cGRhdGVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZERvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoY2hhdElkKTtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gc3RvcmUgdGhlIG1lc3NhZ2UgaW4gbWVtb3J5ICAgICAgICBcbiAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VTdGF0dXMgPSAnU2VuZGluZy4uLic7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlSW5kZXggPSBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcblxuICAgICAgICAvLyBwdXNoIG1lc3NhZ2UgdG8gZmlyZWJhc2VcbiAgICAgICAgZmlyZWJhc2UucHVzaChcbiAgICAgICAgICAgICcvdXNlcnMvJyArIG5ld0ZyaWVuZERvY3VtZW50Ll9pZCArICcveicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUF1dGhvcjogZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5zZXR0aW5ncy5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlVGV4dDogbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlVGltZVNlbnQ6IGZpcmViYXNlLlNlcnZlclZhbHVlLlRJTUVTVEFNUFxuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgICAgICAvLyB0aGVuIHB1c2ggbm90aWZpY2F0aW9uIG9mIHRoZSBtZXNzYWdlIHNlbnQgICAgXG4gICAgICAgICAgICAudGhlbihwdXNoUmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbnRNZXNzYWdlUmVmID0gcHVzaFJlc3BvbnNlLmtleTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAnbm90aWZpY2F0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VSZWY6IHNlbnRNZXNzYWdlUmVmLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0VXNlcjogbmV3RnJpZW5kRG9jdW1lbnQuX2lkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgLy90aGVuIHVwZGF0ZSB0aGUgbG9jYWwgc3RhdGUgICAgXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIlNlbnRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgnTWVzc2FnZSBTZW50Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0ubWVzc2FnZVN0YXR1cyA9IFwiRmFpbGVkXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG52YXIgcmV0cmlldmVNZXNzYWdlID0gZnVuY3Rpb24gKHRhcmdldFVzZXI6IHN0cmluZywgbWVzc2FnZVJlZjogc3RyaW5nKTogUHJvbWlzZTx7IGlkOiBzdHJpbmcsIG5pY2tuYW1lOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHZhciBteU1lc3NhZ2VQYXRoID0gJ3VzZXJzLycgKyB0YXJnZXRVc2VyICsgJy96LycgKyBtZXNzYWdlUmVmO1xuICAgICAgICBmaXJlYmFzZS5hZGRWYWx1ZUV2ZW50TGlzdGVuZXIoc25hcHNob3QgPT4ge1xuICAgICAgICAgICAgLy8gb25seSBnZXQgZXhjaXRlZCB3aGVuIHRoaW5ncyBhcmUgQWRkZWQgdG8gdGhlIFBhdGgsIG5vdCBhbHNvIG9uIHRoZSBSZW1vdmUgZXZlbnQgd2hpY2ggaXMgdHJpZ2dlcmVkIGxhdGVyLiAgICAgIFxuICAgICAgICAgICAgaWYgKHNuYXBzaG90LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlY2VpdmVkID0gc25hcHNob3QudmFsdWU7XG5cbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgbmV3IE1lc3NhZ2UoKSBmb3IgbG9jYWwgY29uc3VtcHRpb25cbiAgICAgICAgICAgICAgICB2YXIgbmV3TWVzc2FnZSA9IG5ldyBNZXNzYWdlKCcnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCA9IHJlY2VpdmVkLm1lc3NhZ2VUZXh0O1xuICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRpbWVTZW50ID0gbmV3IERhdGUocmVjZWl2ZWQubWVzc2FnZVRpbWVTZW50KTtcbiAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldEZyaWVuZCA9IGdldEZyaWVuZChyZWNlaXZlZC5tZXNzYWdlQXV0aG9yKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQubWVzc2FnZXMucHVzaChuZXdNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRGcmllbmQudGltZUxhc3RNZXNzYWdlID0gbmV3TWVzc2FnZS5tZXNzYWdlVGltZVJlY2VpdmVkO1xuICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC5sYXN0TWVzc2FnZVByZXZpZXcgPSByZWNlaXZlZC5tZXNzYWdlVGV4dDsgICAgICAgICAgICAgLy8gdGhpcyBjb3VsZCBiZSB0cmltbWVkIG9yIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC51bnJlYWRNZXNzYWdlc051bWJlciArPSAxO1xuXG4gICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQocmVjZWl2ZWQubWVzc2FnZUF1dGhvciwgdGFyZ2V0RnJpZW5kKTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShteU1lc3NhZ2VQYXRoLCBudWxsKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcmVjZWl2ZWQubWVzc2FnZUF1dGhvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pY2tuYW1lOiB0YXJnZXRGcmllbmQubmlja25hbWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIG15TWVzc2FnZVBhdGgpXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIFJhbmRvbSB1dGlsaXR5IGZ1bmN0aW9uc1xuXG5mdW5jdGlvbiBnZXRSYW5kb21pc2hTdHJpbmcoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xufSJdfQ==