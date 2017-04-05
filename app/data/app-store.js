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
exports.initAppData = function () {
    return new Promise(function (resolve, reject) {
        // 1. Initialise / fetch the local Couchbase database and create an app settings document
        var appDocumentRef = database.getDocument('squeak-app');
        // 2. Initialise Firebase + get push messaging token + set up message received handling
        var firebaseMessagingToken;
        var userUID;
        firebase.init({
            onMessageReceivedCallback: function (message) {
                retrieveMessage(message.targetUser, message.messageToFetchRef)
                    .then(function (sender) {
                    notificationService.notificationListenerInit(sender.id);
                    notificationService.alertNow(sender.nickname);
                });
            },
            onPushTokenReceivedCallback: function (token) {
                firebaseMessagingToken = token;
                // If the Couchbase database has already been initialised, re-login with Firebase and resolve
                if (appDocumentRef) {
                    // Connect to firebase and log in with Annonymous Login
                    firebase.login({
                        type: firebase.LoginType.PASSWORD,
                        email: appDocumentRef.settings.randomIdentity.email,
                        password: appDocumentRef.settings.randomIdentity.password
                    })
                        .then(function (user) {
                    }, function (error) {
                        alert('Error: ' + error);
                    });
                    resolve('App Data initialised.'); // do not wait for firebase - user should be able to see local data
                }
                else {
                    var randomEmail = getRandomishString() + '@' + getRandomishString() + '.com';
                    var randomPassword = getRandomishString() + getRandomishString();
                    console.log('creating user... ');
                    firebase.createUser({
                        email: randomEmail,
                        password: randomPassword
                    }).then(function (user) {
                        console.log('user created. creating local document... ');
                        userUID = user.key;
                        database.createDocument({
                            appName: 'Squeak',
                            settings: {
                                firebaseUID: userUID,
                                fcmMessagingToken: firebaseMessagingToken,
                                randomIdentity: {
                                    email: randomEmail,
                                    password: randomPassword
                                }
                            }
                        }, 'squeak-app');
                        console.log('local document created. setting key values to firebase...');
                        firebase.setValue('/users/' + userUID, {
                            k: '',
                            t: firebaseMessagingToken,
                            x: [],
                            z: []
                        }).then(function () {
                            console.log('values set to firebase. Init success!');
                            alert('New Anonymous identity created!');
                            resolve('App Data initialised.');
                        }, function (error) {
                            alert('Failed to register Anonymous identity on remote servers ' + error);
                        });
                    }, function (error) {
                        alert('Failed to Initialise local Coucbase data: ' + error);
                    });
                }
            }
        }).then(function (instance) {
        }, function (error) {
            alert("Firebase failed to Initialise: " + error);
        });
    });
};
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
        database.createDocument(newFriend, 'qwucLynmR4diFTHr2SRevheaS1M2');
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
                console.dump(snapshot);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUNuRCxvREFBc0Q7QUFFdEQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRWhELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFM0MsUUFBQSxXQUFXLEdBQUc7SUFDckIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IseUZBQXlGO1FBQ3pGLElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFeEQsdUZBQXVGO1FBQ3ZGLElBQUksc0JBQXNCLENBQUM7UUFDM0IsSUFBSSxPQUFPLENB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LENBQUM7Z0JBRXZDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRXZCLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDOUQsUUFBUSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUN4QyxPQUFPLENBQUM7d0JBQ0osRUFBRSxFQUFFLFFBQVEsQ0FBQyxhQUFhO3dCQUMxQixRQUFRLEVBQUUsWUFBWSxDQUFDLFFBQVE7cUJBQ2xDLENBQUMsQ0FBQztnQkFDUCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7UUFDTCxDQUFDLEVBQUUsYUFBYSxDQUFDO2FBQ1osS0FBSyxDQUFDLFVBQUEsS0FBSztZQUNSLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNiLE1BQU0sRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUdELDJCQUEyQjtBQUUzQjtJQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZmlyZWJhc2UgZnJvbSAnbmF0aXZlc2NyaXB0LXBsdWdpbi1maXJlYmFzZSc7XG5pbXBvcnQgeyBDb3VjaGJhc2UgfSBmcm9tICduYXRpdmVzY3JpcHQtY291Y2hiYXNlJztcblxuaW1wb3J0IHsgRnJpZW5kLCBNZXNzYWdlIH0gZnJvbSAnLi9hcHAtZGF0YS1tb2RlbCc7XG5pbXBvcnQgKiBhcyBub3RpZmljYXRpb25TZXJ2aWNlIGZyb20gJy4vbm90aWZpY2F0aW9uJztcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEFQSTpcbi8vIFxuLy8gaW5pdEZyaWVuZHNEYXRhKCkudGhlbig8ZG8gc3R1ZmY+KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGluaXRhbGlzZXMgdGhlIERhdGFiYXNlIGFuZCB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBnZXRGcmllbmRzTGlzdCgpLnRoZW4oIGZyaWVuZHNMaXN0ID0+IHsgPGRvIHN0dWZmIHdpdGggZnJpZW5kc0xpc3QgQXJyYXk+IH0gKSAgICAgICAgLS0gZ2V0cyB0aGUgZnJpZW5kc0xpc3QgYXMgYW4gQXJyYXlcbi8vIGFkZEZyaWVuZCg8ZnJpZW5kIG5pY2tuYW1lPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHJlbW92ZUZyaWVuZCg8ZnJpZW5kIF9pZD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHVwZGF0ZUZyaWVuZCg8ZnJpZW5kIF9pZD4sIDxuZXcgZGF0YSBjb250ZW50PikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBDb3VjaGJhc2UgaW5pdGlhbCBjb25maWd1cmF0aW9uXG5jb25zdCBEQl9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ2NvdWNoYmFzZS5kYicsXG59XG52YXIgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcblxuLy8gUHJlLWRlZmluZSBRdWVyaWVzXG5kYXRhYmFzZS5jcmVhdGVWaWV3KCdmcmllbmRzJywgJzEnLCAoZG9jdW1lbnQsIGVtaXR0ZXIpID0+IHtcbiAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRUeXBlID09PSAnRnJpZW5kJykge1xuICAgICAgICBlbWl0dGVyLmVtaXQoZG9jdW1lbnQudGltZUxhc3RNZXNzYWdlLCBkb2N1bWVudCk7ICAgICAvLyBjYWxsIGJhY2sgd2l0aCB0aGlzIGRvY3VtZW50O1xuICAgIH07XG59KTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBVdGlsaXR5IGZ1bmN0aW9ucyBleHBvc2VkIHRvIGFsbCBvdGhlciBWaWV3cywgd2hpY2ggYWJzdHJhY3QgYXdheSBjb21wbGV0ZWx5IGZyb20gdGhlIERCIGJhY2tlbmQuIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gR2VuZXJhbCBBcHAgZGV0YWlscyBkYXRhIGFuZCBEYXRhYmFzZSBpbml0YWxpc2F0aW9uXG5cbmV4cG9ydCB2YXIgaW5pdEFwcERhdGEgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAvLyAxLiBJbml0aWFsaXNlIC8gZmV0Y2ggdGhlIGxvY2FsIENvdWNoYmFzZSBkYXRhYmFzZSBhbmQgY3JlYXRlIGFuIGFwcCBzZXR0aW5ncyBkb2N1bWVudFxuICAgICAgICB2YXIgYXBwRG9jdW1lbnRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgIC8vIDIuIEluaXRpYWxpc2UgRmlyZWJhc2UgKyBnZXQgcHVzaCBtZXNzYWdpbmcgdG9rZW4gKyBzZXQgdXAgbWVzc2FnZSByZWNlaXZlZCBoYW5kbGluZ1xuICAgICAgICB2YXIgZmlyZWJhc2VNZXNzYWdpbmdUb2tlbjtcbiAgICAgICAgdmFyIHVzZXJVSUQ7XG4gICAgICAgIGZpcmViYXNlLmluaXQoe1xuXG4gICAgICAgICAgICBvbk1lc3NhZ2VSZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAobWVzc2FnZTogYW55KSB7XG4gICAgICAgICAgICAgICAgcmV0cmlldmVNZXNzYWdlKG1lc3NhZ2UudGFyZ2V0VXNlciwgbWVzc2FnZS5tZXNzYWdlVG9GZXRjaFJlZilcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oc2VuZGVyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblNlcnZpY2Uubm90aWZpY2F0aW9uTGlzdGVuZXJJbml0KHNlbmRlci5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb25TZXJ2aWNlLmFsZXJ0Tm93KHNlbmRlci5uaWNrbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25QdXNoVG9rZW5SZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAodG9rZW4pIHtcblxuICAgICAgICAgICAgICAgIGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPSB0b2tlbjtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBDb3VjaGJhc2UgZGF0YWJhc2UgaGFzIGFscmVhZHkgYmVlbiBpbml0aWFsaXNlZCwgcmUtbG9naW4gd2l0aCBGaXJlYmFzZSBhbmQgcmVzb2x2ZVxuICAgICAgICAgICAgICAgIGlmIChhcHBEb2N1bWVudFJlZikge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb25uZWN0IHRvIGZpcmViYXNlIGFuZCBsb2cgaW4gd2l0aCBBbm5vbnltb3VzIExvZ2luXG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlLmxvZ2luKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpcmViYXNlLkxvZ2luVHlwZS5QQVNTV09SRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5wYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4odXNlciA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3I6ICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIERhdGEgaW5pdGlhbGlzZWQuJyk7ICAgICAgICAgICAvLyBkbyBub3Qgd2FpdCBmb3IgZmlyZWJhc2UgLSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIHNlZSBsb2NhbCBkYXRhXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRWxzZSBjcmVhdGUgbmV3IHJhbmRvbS9hbm9ueW1vdXMgdXNlciwgaW5pdGFsaXNlIHRoZSBBcHAgRG9jdW1lbnQgd2l0aCB0aG9zZSBkZXRhaWxzIGFuZCBwcm9jZWVkXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByYW5kb21FbWFpbCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgJ0AnICsgZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnLmNvbSc7XG4gICAgICAgICAgICAgICAgICAgIHZhciByYW5kb21QYXNzd29yZCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgZ2V0UmFuZG9taXNoU3RyaW5nKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0aW5nIHVzZXIuLi4gJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlLmNyZWF0ZVVzZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHJhbmRvbUVtYWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkXG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4odXNlciA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyIGNyZWF0ZWQuIGNyZWF0aW5nIGxvY2FsIGRvY3VtZW50Li4uICcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlclVJRCA9IHVzZXIua2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcE5hbWU6ICdTcXVlYWsnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyVUlELFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmY21NZXNzYWdpbmdUb2tlbjogZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZG9tSWRlbnRpdHk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgJ3NxdWVhay1hcHAnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xvY2FsIGRvY3VtZW50IGNyZWF0ZWQuIHNldHRpbmcga2V5IHZhbHVlcyB0byBmaXJlYmFzZS4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJy91c2Vycy8nICsgdXNlclVJRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGs6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0OiBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3ZhbHVlcyBzZXQgdG8gZmlyZWJhc2UuIEluaXQgc3VjY2VzcyEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnTmV3IEFub255bW91cyBpZGVudGl0eSBjcmVhdGVkIScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGluaXRpYWxpc2VkLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gcmVnaXN0ZXIgQW5vbnltb3VzIGlkZW50aXR5IG9uIHJlbW90ZSBzZXJ2ZXJzICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byBJbml0aWFsaXNlIGxvY2FsIENvdWNiYXNlIGRhdGE6ICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihpbnN0YW5jZSA9PiB7XG5cbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgYWxlcnQoXCJGaXJlYmFzZSBmYWlsZWQgdG8gSW5pdGlhbGlzZTogXCIgKyBlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIEZyaWVuZHMgTGlzdCByZWxhdGVkIGRhdGFcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZyaWVuZChmcmllbmRJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KGZyaWVuZElkKTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIGZyaWVuZHNMaXN0UXVlcnkgPSBkYXRhYmFzZS5leGVjdXRlUXVlcnkoJ2ZyaWVuZHMnKTtcbiAgICAgICAgaWYgKGZyaWVuZHNMaXN0UXVlcnkpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZnJpZW5kc0xpc3RRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoJ0NvdWxkIG5vdCBvYnRhaW4gTGlzdCBvZiBGcmllbmRzIGZyb20gRGF0YWJhc2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChuaWNrbmFtZTogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgbmV3RnJpZW5kID0gbmV3IEZyaWVuZChuaWNrbmFtZSk7XG4gICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KG5ld0ZyaWVuZCwgJ3F3dWNMeW5tUjRkaUZUSHIyU1JldmhlYVMxTTInKTtcblxuICAgICAgICByZXNvbHZlKCdBZGRlZCBOZXcgRnJpZW5kJyk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgcmVtb3ZlRnJpZW5kID0gZnVuY3Rpb24gKHRhcmdldElkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGRhdGFiYXNlLmRlbGV0ZURvY3VtZW50KHRhcmdldElkKTtcblxuICAgICAgICByZXNvbHZlKCdSZW1vdmVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHVwZGF0ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nLCBuZXdQcm9wZXJ0aWVzOiBPYmplY3QpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KHRhcmdldElkLCBuZXdQcm9wZXJ0aWVzKTtcblxuICAgICAgICByZXNvbHZlKCdFZGl0ZWQgRnJpZW5kJyk7XG4gICAgfSk7XG59XG5cblxuLy8gTWVzc2FnZXMgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCB2YXIgc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbiAoY2hhdElkOiBzdHJpbmcsIG1lc3NhZ2VUZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgbmV3RnJpZW5kRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudChjaGF0SWQpO1xuICAgICAgICB2YXIgbmV3TWVzc2FnZSA9IG5ldyBNZXNzYWdlKG1lc3NhZ2VUZXh0LCB0cnVlKTtcblxuICAgICAgICAvLyBzdG9yZSB0aGUgbWVzc2FnZSBpbiBtZW1vcnkgICAgICAgIFxuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVN0YXR1cyA9ICdTZW5kaW5nLi4uJztcbiAgICAgICAgdmFyIG5ld01lc3NhZ2VJbmRleCA9IG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuXG4gICAgICAgIC8vIHB1c2ggbWVzc2FnZSB0byBmaXJlYmFzZVxuICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgJy91c2Vycy8nICsgbmV3RnJpZW5kRG9jdW1lbnQuX2lkICsgJy96JyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlQXV0aG9yOiBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpLnNldHRpbmdzLmZpcmViYXNlVUlELFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VUZXh0OiBuZXdNZXNzYWdlLm1lc3NhZ2VUZXh0LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VUaW1lU2VudDogZmlyZWJhc2UuU2VydmVyVmFsdWUuVElNRVNUQU1QXG4gICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgICAgIC8vIHRoZW4gcHVzaCBub3RpZmljYXRpb24gb2YgdGhlIG1lc3NhZ2Ugc2VudCAgICBcbiAgICAgICAgICAgIC50aGVuKHB1c2hSZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VudE1lc3NhZ2VSZWYgPSBwdXNoUmVzcG9uc2Uua2V5O1xuICAgICAgICAgICAgICAgIGZpcmViYXNlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICdub3RpZmljYXRpb25zJyxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZVJlZjogc2VudE1lc3NhZ2VSZWYsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRVc2VyOiBuZXdGcmllbmREb2N1bWVudC5faWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAvL3RoZW4gdXBkYXRlIHRoZSBsb2NhbCBzdGF0ZSAgICBcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0ubWVzc2FnZVN0YXR1cyA9IFwiU2VudFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCdNZXNzYWdlIFNlbnQnKTtcblxuICAgICAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJGYWlsZWRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXNbbmV3TWVzc2FnZUluZGV4IC0gMV0ubWVzc2FnZVN0YXR1cyA9IFwiRmFpbGVkXCI7XG4gICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbnZhciByZXRyaWV2ZU1lc3NhZ2UgPSBmdW5jdGlvbiAodGFyZ2V0VXNlcjogc3RyaW5nLCBtZXNzYWdlUmVmOiBzdHJpbmcpOiBQcm9taXNlPHsgaWQ6IHN0cmluZywgbmlja25hbWU6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG15TWVzc2FnZVBhdGggPSAndXNlcnMvJyArIHRhcmdldFVzZXIgKyAnL3ovJyArIG1lc3NhZ2VSZWY7XG4gICAgICAgIGZpcmViYXNlLmFkZFZhbHVlRXZlbnRMaXN0ZW5lcihzbmFwc2hvdCA9PiB7XG4gICAgICAgICAgICAvLyBvbmx5IGdldCBleGNpdGVkIHdoZW4gdGhpbmdzIGFyZSBBZGRlZCB0byB0aGUgUGF0aCwgbm90IGFsc28gb24gdGhlIFJlbW92ZSBldmVudCB3aGljaCBpcyB0cmlnZ2VyZWQgbGF0ZXIuICAgICAgXG4gICAgICAgICAgICBpZiAoc25hcHNob3QudmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVjZWl2ZWQgPSBzbmFwc2hvdC52YWx1ZTtcblxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBuZXcgTWVzc2FnZSgpIGZvciBsb2NhbCBjb25zdW1wdGlvblxuICAgICAgICAgICAgICAgIHZhciBuZXdNZXNzYWdlID0gbmV3IE1lc3NhZ2UoJycsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUZXh0ID0gcmVjZWl2ZWQubWVzc2FnZVRleHQ7XG4gICAgICAgICAgICAgICAgbmV3TWVzc2FnZS5tZXNzYWdlVGltZVNlbnQgPSBuZXcgRGF0ZShyZWNlaXZlZC5tZXNzYWdlVGltZVNlbnQpO1xuICAgICAgICAgICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRpbWVSZWNlaXZlZCA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0RnJpZW5kID0gZ2V0RnJpZW5kKHJlY2VpdmVkLm1lc3NhZ2VBdXRob3IpO1xuICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHRhcmdldEZyaWVuZC50aW1lTGFzdE1lc3NhZ2UgPSBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lUmVjZWl2ZWQ7XG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLmxhc3RNZXNzYWdlUHJldmlldyA9IHJlY2VpdmVkLm1lc3NhZ2VUZXh0OyAgICAgICAgICAgICAvLyB0aGlzIGNvdWxkIGJlIHRyaW1tZWQgb3Igc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgdGFyZ2V0RnJpZW5kLnVucmVhZE1lc3NhZ2VzTnVtYmVyICs9IDE7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmR1bXAoc25hcHNob3QpO1xuXG4gICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQocmVjZWl2ZWQubWVzc2FnZUF1dGhvciwgdGFyZ2V0RnJpZW5kKTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5zZXRWYWx1ZShteU1lc3NhZ2VQYXRoLCBudWxsKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcmVjZWl2ZWQubWVzc2FnZUF1dGhvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pY2tuYW1lOiB0YXJnZXRGcmllbmQubmlja25hbWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIG15TWVzc2FnZVBhdGgpXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIFJhbmRvbSB1dGlsaXR5IGZ1bmN0aW9uc1xuXG5mdW5jdGlvbiBnZXRSYW5kb21pc2hTdHJpbmcoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xufSJdfQ==