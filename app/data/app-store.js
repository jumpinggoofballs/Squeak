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
                    .then(function (retrieved) {
                    notificationService.notificationListenerInit(retrieved.messageAuthor);
                    notificationService.alertNow('new message');
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
exports.addFriend = function (nickname, firebaseId) {
    return new Promise(function (resolve, reject) {
        var newFriend = new app_data_model_1.Friend(nickname, firebaseId);
        database.createDocument(newFriend);
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
        firebase.push('/users/' + newFriendDocument.firebaseId + '/z', {
            messageAuthor: database.getDocument('squeak-app').settings.firebaseUID,
            messageText: newMessage.messageText,
            messageTimeSent: firebase.ServerValue.TIMESTAMP
        })
            .then(function (pushResponse) {
            var sentMessageRef = pushResponse.key;
            firebase.push('notifications', {
                messageRef: sentMessageRef,
                targetUser: newFriendDocument.firebaseId
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
            var message = snapshot.value;
            console.dump(message);
            firebase.setValue(myMessagePath, null).then(function () {
                resolve(message);
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUNuRCxvREFBc0Q7QUFFdEQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRWhELHFCQUFxQjtBQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFM0MsUUFBQSxXQUFXLEdBQUc7SUFDckIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IseUZBQXlGO1FBQ3pGLElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFeEQsdUZBQXVGO1FBQ3ZGLElBQUksc0JBQXNCLENBQUM7UUFDM0IsSUFBSSxPQUFPLENB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Q0FBQztZQUNuRCxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDYixNQUFNLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFFRCxJQUFJLGVBQWUsR0FBRyxVQUFVLFVBQWtCLEVBQUUsVUFBa0I7SUFDbEUsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFDL0IsSUFBSSxhQUFhLEdBQUcsUUFBUSxHQUFHLFVBQVUsR0FBRyxLQUFLLEdBQUcsVUFBVSxDQUFDO1FBQy9ELFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFBLFFBQVE7WUFDbkMsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztZQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RCLFFBQVEsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDeEMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxFQUFFLGFBQWEsQ0FBQzthQUNaLEtBQUssQ0FBQyxVQUFBLEtBQUs7WUFDUixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDYixNQUFNLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFHRCwyQkFBMkI7QUFFM0I7SUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZpcmViYXNlIGZyb20gJ25hdGl2ZXNjcmlwdC1wbHVnaW4tZmlyZWJhc2UnO1xuaW1wb3J0IHsgQ291Y2hiYXNlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWNvdWNoYmFzZSc7XG5cbmltcG9ydCB7IEZyaWVuZCwgTWVzc2FnZSB9IGZyb20gJy4vYXBwLWRhdGEtbW9kZWwnO1xuaW1wb3J0ICogYXMgbm90aWZpY2F0aW9uU2VydmljZSBmcm9tICcuL25vdGlmaWNhdGlvbic7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBBUEk6XG4vLyBcbi8vIGluaXRGcmllbmRzRGF0YSgpLnRoZW4oPGRvIHN0dWZmPikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBpbml0YWxpc2VzIHRoZSBEYXRhYmFzZSBhbmQgdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gZ2V0RnJpZW5kc0xpc3QoKS50aGVuKCBmcmllbmRzTGlzdCA9PiB7IDxkbyBzdHVmZiB3aXRoIGZyaWVuZHNMaXN0IEFycmF5PiB9ICkgICAgICAgIC0tIGdldHMgdGhlIGZyaWVuZHNMaXN0IGFzIGFuIEFycmF5XG4vLyBhZGRGcmllbmQoPGZyaWVuZCBuaWNrbmFtZT4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyByZW1vdmVGcmllbmQoPGZyaWVuZCBfaWQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyB1cGRhdGVGcmllbmQoPGZyaWVuZCBfaWQ+LCA8bmV3IGRhdGEgY29udGVudD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gQ291Y2hiYXNlIGluaXRpYWwgY29uZmlndXJhdGlvblxuY29uc3QgREJfY29uZmlnID0ge1xuICAgIGRiX25hbWU6ICdjb3VjaGJhc2UuZGInLFxufVxudmFyIGRhdGFiYXNlID0gbmV3IENvdWNoYmFzZShEQl9jb25maWcuZGJfbmFtZSk7XG5cbi8vIFByZS1kZWZpbmUgUXVlcmllc1xuZGF0YWJhc2UuY3JlYXRlVmlldygnZnJpZW5kcycsICcxJywgKGRvY3VtZW50LCBlbWl0dGVyKSA9PiB7XG4gICAgaWYgKGRvY3VtZW50LmRvY3VtZW50VHlwZSA9PT0gJ0ZyaWVuZCcpIHtcbiAgICAgICAgZW1pdHRlci5lbWl0KGRvY3VtZW50LnRpbWVMYXN0TWVzc2FnZSwgZG9jdW1lbnQpOyAgICAgLy8gY2FsbCBiYWNrIHdpdGggdGhpcyBkb2N1bWVudDtcbiAgICB9O1xufSk7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gVXRpbGl0eSBmdW5jdGlvbnMgZXhwb3NlZCB0byBhbGwgb3RoZXIgVmlld3MsIHdoaWNoIGFic3RyYWN0IGF3YXkgY29tcGxldGVseSBmcm9tIHRoZSBEQiBiYWNrZW5kLiBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIEdlbmVyYWwgQXBwIGRldGFpbHMgZGF0YSBhbmQgRGF0YWJhc2UgaW5pdGFsaXNhdGlvblxuXG5leHBvcnQgdmFyIGluaXRBcHBEYXRhID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gMS4gSW5pdGlhbGlzZSAvIGZldGNoIHRoZSBsb2NhbCBDb3VjaGJhc2UgZGF0YWJhc2UgYW5kIGNyZWF0ZSBhbiBhcHAgc2V0dGluZ3MgZG9jdW1lbnRcbiAgICAgICAgdmFyIGFwcERvY3VtZW50UmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcblxuICAgICAgICAvLyAyLiBJbml0aWFsaXNlIEZpcmViYXNlICsgZ2V0IHB1c2ggbWVzc2FnaW5nIHRva2VuICsgc2V0IHVwIG1lc3NhZ2UgcmVjZWl2ZWQgaGFuZGxpbmdcbiAgICAgICAgdmFyIGZpcmViYXNlTWVzc2FnaW5nVG9rZW47XG4gICAgICAgIHZhciB1c2VyVUlEO1xuICAgICAgICBmaXJlYmFzZS5pbml0KHtcblxuICAgICAgICAgICAgb25NZXNzYWdlUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKG1lc3NhZ2U6IGFueSkge1xuICAgICAgICAgICAgICAgIHJldHJpZXZlTWVzc2FnZShtZXNzYWdlLnRhcmdldFVzZXIsIG1lc3NhZ2UubWVzc2FnZVRvRmV0Y2hSZWYpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKChyZXRyaWV2ZWQ6IE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblNlcnZpY2Uubm90aWZpY2F0aW9uTGlzdGVuZXJJbml0KHJldHJpZXZlZC5tZXNzYWdlQXV0aG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvblNlcnZpY2UuYWxlcnROb3coJ25ldyBtZXNzYWdlJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25QdXNoVG9rZW5SZWNlaXZlZENhbGxiYWNrOiBmdW5jdGlvbiAodG9rZW4pIHtcblxuICAgICAgICAgICAgICAgIGZpcmViYXNlTWVzc2FnaW5nVG9rZW4gPSB0b2tlbjtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBDb3VjaGJhc2UgZGF0YWJhc2UgaGFzIGFscmVhZHkgYmVlbiBpbml0aWFsaXNlZCwgcmUtbG9naW4gd2l0aCBGaXJlYmFzZSBhbmQgcmVzb2x2ZVxuICAgICAgICAgICAgICAgIGlmIChhcHBEb2N1bWVudFJlZikge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb25uZWN0IHRvIGZpcmViYXNlIGFuZCBsb2cgaW4gd2l0aCBBbm5vbnltb3VzIExvZ2luXG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlLmxvZ2luKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpcmViYXNlLkxvZ2luVHlwZS5QQVNTV09SRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5wYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4odXNlciA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRXJyb3I6ICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIERhdGEgaW5pdGlhbGlzZWQuJyk7ICAgICAgICAgICAvLyBkbyBub3Qgd2FpdCBmb3IgZmlyZWJhc2UgLSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIHNlZSBsb2NhbCBkYXRhXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRWxzZSBjcmVhdGUgbmV3IHJhbmRvbS9hbm9ueW1vdXMgdXNlciwgaW5pdGFsaXNlIHRoZSBBcHAgRG9jdW1lbnQgd2l0aCB0aG9zZSBkZXRhaWxzIGFuZCBwcm9jZWVkXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByYW5kb21FbWFpbCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgJ0AnICsgZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnLmNvbSc7XG4gICAgICAgICAgICAgICAgICAgIHZhciByYW5kb21QYXNzd29yZCA9IGdldFJhbmRvbWlzaFN0cmluZygpICsgZ2V0UmFuZG9taXNoU3RyaW5nKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0aW5nIHVzZXIuLi4gJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpcmViYXNlLmNyZWF0ZVVzZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHJhbmRvbUVtYWlsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkXG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4odXNlciA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyIGNyZWF0ZWQuIGNyZWF0aW5nIGxvY2FsIGRvY3VtZW50Li4uICcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlclVJRCA9IHVzZXIua2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcE5hbWU6ICdTcXVlYWsnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlVUlEOiB1c2VyVUlELFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmY21NZXNzYWdpbmdUb2tlbjogZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZG9tSWRlbnRpdHk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgJ3NxdWVhay1hcHAnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xvY2FsIGRvY3VtZW50IGNyZWF0ZWQuIHNldHRpbmcga2V5IHZhbHVlcyB0byBmaXJlYmFzZS4uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJy91c2Vycy8nICsgdXNlclVJRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGs6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0OiBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3ZhbHVlcyBzZXQgdG8gZmlyZWJhc2UuIEluaXQgc3VjY2VzcyEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnTmV3IEFub255bW91cyBpZGVudGl0eSBjcmVhdGVkIScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGluaXRpYWxpc2VkLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gcmVnaXN0ZXIgQW5vbnltb3VzIGlkZW50aXR5IG9uIHJlbW90ZSBzZXJ2ZXJzICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byBJbml0aWFsaXNlIGxvY2FsIENvdWNiYXNlIGRhdGE6ICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihpbnN0YW5jZSA9PiB7XG5cbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgYWxlcnQoXCJGaXJlYmFzZSBmYWlsZWQgdG8gSW5pdGlhbGlzZTogXCIgKyBlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5cbi8vIEZyaWVuZHMgTGlzdCByZWxhdGVkIGRhdGFcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZyaWVuZChmcmllbmRJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KGZyaWVuZElkKTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIGZyaWVuZHNMaXN0UXVlcnkgPSBkYXRhYmFzZS5leGVjdXRlUXVlcnkoJ2ZyaWVuZHMnKTtcbiAgICAgICAgaWYgKGZyaWVuZHNMaXN0UXVlcnkpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZnJpZW5kc0xpc3RRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoJ0NvdWxkIG5vdCBvYnRhaW4gTGlzdCBvZiBGcmllbmRzIGZyb20gRGF0YWJhc2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChuaWNrbmFtZTogc3RyaW5nLCBmaXJlYmFzZUlkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBuZXdGcmllbmQgPSBuZXcgRnJpZW5kKG5pY2tuYW1lLCBmaXJlYmFzZUlkKTtcbiAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQobmV3RnJpZW5kKTtcblxuICAgICAgICByZXNvbHZlKCdBZGRlZCBOZXcgRnJpZW5kJyk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgcmVtb3ZlRnJpZW5kID0gZnVuY3Rpb24gKHRhcmdldElkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGRhdGFiYXNlLmRlbGV0ZURvY3VtZW50KHRhcmdldElkKTtcblxuICAgICAgICByZXNvbHZlKCdSZW1vdmVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHVwZGF0ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nLCBuZXdQcm9wZXJ0aWVzOiBPYmplY3QpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KHRhcmdldElkLCBuZXdQcm9wZXJ0aWVzKTtcblxuICAgICAgICByZXNvbHZlKCdFZGl0ZWQgRnJpZW5kJyk7XG4gICAgfSk7XG59XG5cblxuLy8gTWVzc2FnZXMgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCB2YXIgc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbiAoY2hhdElkOiBzdHJpbmcsIG1lc3NhZ2VUZXh0OiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgbmV3RnJpZW5kRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudChjaGF0SWQpO1xuICAgICAgICB2YXIgbmV3TWVzc2FnZSA9IG5ldyBNZXNzYWdlKG1lc3NhZ2VUZXh0LCB0cnVlKTtcblxuICAgICAgICAvLyBzdG9yZSB0aGUgbWVzc2FnZSBpbiBtZW1vcnkgICAgICAgIFxuICAgICAgICBuZXdNZXNzYWdlLm1lc3NhZ2VUaW1lU2VudCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVN0YXR1cyA9ICdTZW5kaW5nLi4uJztcbiAgICAgICAgdmFyIG5ld01lc3NhZ2VJbmRleCA9IG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuXG4gICAgICAgIC8vIHB1c2ggbWVzc2FnZSB0byBmaXJlYmFzZVxuICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgJy91c2Vycy8nICsgbmV3RnJpZW5kRG9jdW1lbnQuZmlyZWJhc2VJZCArICcveicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUF1dGhvcjogZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5zZXR0aW5ncy5maXJlYmFzZVVJRCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlVGV4dDogbmV3TWVzc2FnZS5tZXNzYWdlVGV4dCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlVGltZVNlbnQ6IGZpcmViYXNlLlNlcnZlclZhbHVlLlRJTUVTVEFNUFxuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgICAgICAvLyB0aGVuIHB1c2ggbm90aWZpY2F0aW9uIG9mIHRoZSBtZXNzYWdlIHNlbnQgICAgXG4gICAgICAgICAgICAudGhlbihwdXNoUmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbnRNZXNzYWdlUmVmID0gcHVzaFJlc3BvbnNlLmtleTtcbiAgICAgICAgICAgICAgICBmaXJlYmFzZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAnbm90aWZpY2F0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VSZWY6IHNlbnRNZXNzYWdlUmVmLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0VXNlcjogbmV3RnJpZW5kRG9jdW1lbnQuZmlyZWJhc2VJZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vdGhlbiB1cGRhdGUgdGhlIGxvY2FsIHN0YXRlICAgIFxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJTZW50XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ01lc3NhZ2UgU2VudCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzW25ld01lc3NhZ2VJbmRleCAtIDFdLm1lc3NhZ2VTdGF0dXMgPSBcIkZhaWxlZFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlc1tuZXdNZXNzYWdlSW5kZXggLSAxXS5tZXNzYWdlU3RhdHVzID0gXCJGYWlsZWRcIjtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxudmFyIHJldHJpZXZlTWVzc2FnZSA9IGZ1bmN0aW9uICh0YXJnZXRVc2VyOiBzdHJpbmcsIG1lc3NhZ2VSZWY6IHN0cmluZyk6IFByb21pc2U8T2JqZWN0PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG15TWVzc2FnZVBhdGggPSAndXNlcnMvJyArIHRhcmdldFVzZXIgKyAnL3ovJyArIG1lc3NhZ2VSZWY7XG4gICAgICAgIGZpcmViYXNlLmFkZFZhbHVlRXZlbnRMaXN0ZW5lcihzbmFwc2hvdCA9PiB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IHNuYXBzaG90LnZhbHVlO1xuICAgICAgICAgICAgY29uc29sZS5kdW1wKG1lc3NhZ2UpO1xuICAgICAgICAgICAgZmlyZWJhc2Uuc2V0VmFsdWUobXlNZXNzYWdlUGF0aCwgbnVsbCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBteU1lc3NhZ2VQYXRoKVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuXG4vLyBSYW5kb20gdXRpbGl0eSBmdW5jdGlvbnNcblxuZnVuY3Rpb24gZ2V0UmFuZG9taXNoU3RyaW5nKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcbn0iXX0=