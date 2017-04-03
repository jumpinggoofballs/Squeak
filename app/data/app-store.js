"use strict";
var firebase = require("nativescript-plugin-firebase");
var nativescript_couchbase_1 = require("nativescript-couchbase");
var app_data_model_1 = require("./app-data-model");
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
                // not needed -- FCM already pops up a notification. But I will want to suppress that and do my own AFTER decryption.
                // notificationService.notificationListenerInit();
                // notificationService.alertNow(message.body);
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
        // push message to firebase
        firebase.push(newFriendDocument.firebaseId + '/z', {
            sentBy: database.getDocument('squeak-app').settings.firebaseUID,
            messageText: newMessage.messageText,
            messageTimeSent: firebase.ServerValue.TIMESTAMP
        });
        // then save it in the local database and resolve
        newMessage.messageTimeSent = new Date();
        newFriendDocument.messages.push(newMessage);
        database.updateDocument(chatId, newFriendDocument);
        resolve('Sending');
    });
};
// Random utility functions
function getRandomishString() {
    return Math.random().toString(36).slice(2);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUVuRCx1QkFBdUI7QUFDdkIsT0FBTztBQUNQLEdBQUc7QUFDSCw2SUFBNkk7QUFDN0ksMkhBQTJIO0FBQzNILGtJQUFrSTtBQUNsSSxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLEdBQUc7QUFDSCx1QkFBdUI7QUFHdkIsa0NBQWtDO0FBQ2xDLElBQU0sU0FBUyxHQUFHO0lBQ2QsT0FBTyxFQUFFLGNBQWM7Q0FDMUIsQ0FBQTtBQUNELElBQUksUUFBUSxHQUFHLElBQUksa0NBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFaEQscUJBQXFCO0FBQ3JCLFFBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxVQUFDLFFBQVEsRUFBRSxPQUFPO0lBQ2xELEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBSyxnQ0FBZ0M7SUFDMUYsQ0FBQztJQUFBLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQztBQUVILDhCQUE4QjtBQUM5QixxR0FBcUc7QUFDckcsOEJBQThCO0FBRzlCLHNEQUFzRDtBQUUzQyxRQUFBLFdBQVcsR0FBRztJQUNyQixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUUvQix5RkFBeUY7UUFDekYsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUV4RCx1RkFBdUY7UUFDdkYsSUFBSSxzQkFBc0IsQ0FBQztRQUMzQixJQUFJLE9BQU8sQ0FBQztRQUNaLFFBQVEs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QUM7QUFDUCxDQUFDLENBQUE7QUFHRCwyQkFBMkI7QUFFM0I7SUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZpcmViYXNlIGZyb20gJ25hdGl2ZXNjcmlwdC1wbHVnaW4tZmlyZWJhc2UnO1xuaW1wb3J0IHsgQ291Y2hiYXNlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWNvdWNoYmFzZSc7XG5cbmltcG9ydCB7IEZyaWVuZCwgTWVzc2FnZSB9IGZyb20gJy4vYXBwLWRhdGEtbW9kZWwnO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gQVBJOlxuLy8gXG4vLyBpbml0RnJpZW5kc0RhdGEoKS50aGVuKDxkbyBzdHVmZj4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gaW5pdGFsaXNlcyB0aGUgRGF0YWJhc2UgYW5kIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIGdldEZyaWVuZHNMaXN0KCkudGhlbiggZnJpZW5kc0xpc3QgPT4geyA8ZG8gc3R1ZmYgd2l0aCBmcmllbmRzTGlzdCBBcnJheT4gfSApICAgICAgICAtLSBnZXRzIHRoZSBmcmllbmRzTGlzdCBhcyBhbiBBcnJheVxuLy8gYWRkRnJpZW5kKDxmcmllbmQgbmlja25hbWU+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gcmVtb3ZlRnJpZW5kKDxmcmllbmQgX2lkPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gdXBkYXRlRnJpZW5kKDxmcmllbmQgX2lkPiwgPG5ldyBkYXRhIGNvbnRlbnQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIENvdWNoYmFzZSBpbml0aWFsIGNvbmZpZ3VyYXRpb25cbmNvbnN0IERCX2NvbmZpZyA9IHtcbiAgICBkYl9uYW1lOiAnY291Y2hiYXNlLmRiJyxcbn1cbnZhciBkYXRhYmFzZSA9IG5ldyBDb3VjaGJhc2UoREJfY29uZmlnLmRiX25hbWUpO1xuXG4vLyBQcmUtZGVmaW5lIFF1ZXJpZXNcbmRhdGFiYXNlLmNyZWF0ZVZpZXcoJ2ZyaWVuZHMnLCAnMScsIChkb2N1bWVudCwgZW1pdHRlcikgPT4ge1xuICAgIGlmIChkb2N1bWVudC5kb2N1bWVudFR5cGUgPT09ICdGcmllbmQnKSB7XG4gICAgICAgIGVtaXR0ZXIuZW1pdChkb2N1bWVudC50aW1lTGFzdE1lc3NhZ2UsIGRvY3VtZW50KTsgICAgIC8vIGNhbGwgYmFjayB3aXRoIHRoaXMgZG9jdW1lbnQ7XG4gICAgfTtcbn0pO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGV4cG9zZWQgdG8gYWxsIG90aGVyIFZpZXdzLCB3aGljaCBhYnN0cmFjdCBhd2F5IGNvbXBsZXRlbHkgZnJvbSB0aGUgREIgYmFja2VuZC4gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBHZW5lcmFsIEFwcCBkZXRhaWxzIGRhdGEgYW5kIERhdGFiYXNlIGluaXRhbGlzYXRpb25cblxuZXhwb3J0IHZhciBpbml0QXBwRGF0YSA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIC8vIDEuIEluaXRpYWxpc2UgLyBmZXRjaCB0aGUgbG9jYWwgQ291Y2hiYXNlIGRhdGFiYXNlIGFuZCBjcmVhdGUgYW4gYXBwIHNldHRpbmdzIGRvY3VtZW50XG4gICAgICAgIHZhciBhcHBEb2N1bWVudFJlZiA9IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJyk7XG5cbiAgICAgICAgLy8gMi4gSW5pdGlhbGlzZSBGaXJlYmFzZSArIGdldCBwdXNoIG1lc3NhZ2luZyB0b2tlbiArIHNldCB1cCBtZXNzYWdlIHJlY2VpdmVkIGhhbmRsaW5nXG4gICAgICAgIHZhciBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuO1xuICAgICAgICB2YXIgdXNlclVJRDtcbiAgICAgICAgZmlyZWJhc2UuaW5pdCh7XG5cbiAgICAgICAgICAgIG9uTWVzc2FnZVJlY2VpdmVkQ2FsbGJhY2s6IGZ1bmN0aW9uIChtZXNzYWdlOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAvLyBub3QgbmVlZGVkIC0tIEZDTSBhbHJlYWR5IHBvcHMgdXAgYSBub3RpZmljYXRpb24uIEJ1dCBJIHdpbGwgd2FudCB0byBzdXBwcmVzcyB0aGF0IGFuZCBkbyBteSBvd24gQUZURVIgZGVjcnlwdGlvbi5cbiAgICAgICAgICAgICAgICAvLyBub3RpZmljYXRpb25TZXJ2aWNlLm5vdGlmaWNhdGlvbkxpc3RlbmVySW5pdCgpO1xuICAgICAgICAgICAgICAgIC8vIG5vdGlmaWNhdGlvblNlcnZpY2UuYWxlcnROb3cobWVzc2FnZS5ib2R5KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uUHVzaFRva2VuUmVjZWl2ZWRDYWxsYmFjazogZnVuY3Rpb24gKHRva2VuKSB7XG5cbiAgICAgICAgICAgICAgICBmaXJlYmFzZU1lc3NhZ2luZ1Rva2VuID0gdG9rZW47XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgQ291Y2hiYXNlIGRhdGFiYXNlIGhhcyBhbHJlYWR5IGJlZW4gaW5pdGlhbGlzZWQsIHJlLWxvZ2luIHdpdGggRmlyZWJhc2UgYW5kIHJlc29sdmVcbiAgICAgICAgICAgICAgICBpZiAoYXBwRG9jdW1lbnRSZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29ubmVjdCB0byBmaXJlYmFzZSBhbmQgbG9nIGluIHdpdGggQW5ub255bW91cyBMb2dpblxuICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZS5sb2dpbih7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaXJlYmFzZS5Mb2dpblR5cGUuUEFTU1dPUkQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkucGFzc3dvcmRcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHVzZXIgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0Vycm9yOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGluaXRpYWxpc2VkLicpOyAgICAgICAgICAgLy8gZG8gbm90IHdhaXQgZm9yIGZpcmViYXNlIC0gdXNlciBzaG91bGQgYmUgYWJsZSB0byBzZWUgbG9jYWwgZGF0YVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEVsc2UgY3JlYXRlIG5ldyByYW5kb20vYW5vbnltb3VzIHVzZXIsIGluaXRhbGlzZSB0aGUgQXBwIERvY3VtZW50IHdpdGggdGhvc2UgZGV0YWlscyBhbmQgcHJvY2VlZFxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZG9tRW1haWwgPSBnZXRSYW5kb21pc2hTdHJpbmcoKSArICdAJyArIGdldFJhbmRvbWlzaFN0cmluZygpICsgJy5jb20nO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZG9tUGFzc3dvcmQgPSBnZXRSYW5kb21pc2hTdHJpbmcoKSArIGdldFJhbmRvbWlzaFN0cmluZygpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjcmVhdGluZyB1c2VyLi4uICcpO1xuICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZS5jcmVhdGVVc2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZFxuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKHVzZXIgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndXNlciBjcmVhdGVkLiBjcmVhdGluZyBsb2NhbCBkb2N1bWVudC4uLiAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJVSUQgPSB1c2VyLmtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBOYW1lOiAnU3F1ZWFrJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJlYmFzZVVJRDogdXNlclVJRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmNtTWVzc2FnaW5nVG9rZW46IGZpcmViYXNlTWVzc2FnaW5nVG9rZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmRvbUlkZW50aXR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogcmFuZG9tRW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogcmFuZG9tUGFzc3dvcmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sICdzcXVlYWstYXBwJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdsb2NhbCBkb2N1bWVudCBjcmVhdGVkLiBzZXR0aW5nIGtleSB2YWx1ZXMgdG8gZmlyZWJhc2UuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcmViYXNlLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcvdXNlcnMvJyArIHVzZXJVSUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdDogZmlyZWJhc2VNZXNzYWdpbmdUb2tlbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd2YWx1ZXMgc2V0IHRvIGZpcmViYXNlLiBJbml0IHN1Y2Nlc3MhJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ05ldyBBbm9ueW1vdXMgaWRlbnRpdHkgY3JlYXRlZCEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCdBcHAgRGF0YSBpbml0aWFsaXNlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRmFpbGVkIHRvIHJlZ2lzdGVyIEFub255bW91cyBpZGVudGl0eSBvbiByZW1vdGUgc2VydmVycyAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gSW5pdGlhbGlzZSBsb2NhbCBDb3VjYmFzZSBkYXRhOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oaW5zdGFuY2UgPT4ge1xuXG4gICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgIGFsZXJ0KFwiRmlyZWJhc2UgZmFpbGVkIHRvIEluaXRpYWxpc2U6IFwiICsgZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuXG4vLyBGcmllbmRzIExpc3QgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGcmllbmQoZnJpZW5kSWQ6IHN0cmluZykge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmRJZCk7XG59XG5cbmV4cG9ydCB2YXIgZ2V0RnJpZW5kc0xpc3QgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IGZyaWVuZHNMaXN0OiBBcnJheTxPYmplY3Q+IH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBmcmllbmRzTGlzdFF1ZXJ5ID0gZGF0YWJhc2UuZXhlY3V0ZVF1ZXJ5KCdmcmllbmRzJyk7XG4gICAgICAgIGlmIChmcmllbmRzTGlzdFF1ZXJ5KSB7XG4gICAgICAgICAgICByZXNvbHZlKGZyaWVuZHNMaXN0UXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KCdDb3VsZCBub3Qgb2J0YWluIExpc3Qgb2YgRnJpZW5kcyBmcm9tIERhdGFiYXNlJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBhZGRGcmllbmQgPSBmdW5jdGlvbiAobmlja25hbWU6IHN0cmluZywgZmlyZWJhc2VJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgbmV3RnJpZW5kID0gbmV3IEZyaWVuZChuaWNrbmFtZSwgZmlyZWJhc2VJZCk7XG4gICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KG5ld0ZyaWVuZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnQWRkZWQgTmV3IEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnUmVtb3ZlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciB1cGRhdGVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZERvY3VtZW50ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoY2hhdElkKTtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gcHVzaCBtZXNzYWdlIHRvIGZpcmViYXNlXG4gICAgICAgIGZpcmViYXNlLnB1c2goXG4gICAgICAgICAgICBuZXdGcmllbmREb2N1bWVudC5maXJlYmFzZUlkICsgJy96JyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzZW50Qnk6IGRhdGFiYXNlLmdldERvY3VtZW50KCdzcXVlYWstYXBwJykuc2V0dGluZ3MuZmlyZWJhc2VVSUQsXG4gICAgICAgICAgICAgICAgbWVzc2FnZVRleHQ6IG5ld01lc3NhZ2UubWVzc2FnZVRleHQsXG4gICAgICAgICAgICAgICAgbWVzc2FnZVRpbWVTZW50OiBmaXJlYmFzZS5TZXJ2ZXJWYWx1ZS5USU1FU1RBTVBcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyB0aGVuIHNhdmUgaXQgaW4gdGhlIGxvY2FsIGRhdGFiYXNlIGFuZCByZXNvbHZlXG4gICAgICAgIG5ld01lc3NhZ2UubWVzc2FnZVRpbWVTZW50ID0gbmV3IERhdGUoKTtcbiAgICAgICAgbmV3RnJpZW5kRG9jdW1lbnQubWVzc2FnZXMucHVzaChuZXdNZXNzYWdlKTtcbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoY2hhdElkLCBuZXdGcmllbmREb2N1bWVudCk7XG4gICAgICAgIHJlc29sdmUoJ1NlbmRpbmcnKTtcbiAgICB9KTtcbn1cblxuXG4vLyBSYW5kb20gdXRpbGl0eSBmdW5jdGlvbnNcblxuZnVuY3Rpb24gZ2V0UmFuZG9taXNoU3RyaW5nKCkge1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyKTtcbn0iXX0=