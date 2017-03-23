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
// updateFriend(<friend _id>, <new data content>).then( logMessage => {<optional>})       -- adds a Friend to the Friends Data Table
// 
///////////////////////
// Couchbase initial configuration
var DB_config = {
    db_name: 'couchbase.db',
};
exports.database = new nativescript_couchbase_1.Couchbase(DB_config.db_name);
// Pre-define Queries
exports.database.createView('friends', '1', function (document, emitter) {
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
        var appDocumentRef = exports.database.getDocument('squeak-app');
        // If the database has already been initialised, re-login with Firebase and resolve
        if (appDocumentRef) {
            // Then connect to firebase and log in with Annonymous Login
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
            var randomEmail = getRandomishString() + '@squeak.com';
            var randomPassword = getRandomishString() + getRandomishString();
            firebase.createUser({
                email: randomEmail,
                password: randomPassword
            })
                .then(function (user) {
                exports.database.createDocument({
                    appName: 'Squeak',
                    settings: {
                        randomIdentity: {
                            email: randomEmail,
                            password: randomPassword
                        }
                    }
                }, 'squeak-app');
                alert('New Anonymous identity created!');
                resolve('App Data initialised.');
            }, function (error) {
                alert('Error: ' + error);
            });
        }
    });
};
// Friends List related data
function getFriend(friendId) {
    return exports.database.getDocument(friendId);
}
exports.getFriend = getFriend;
exports.getFriendsList = function () {
    return new Promise(function (resolve, reject) {
        var friendsListQuery = exports.database.executeQuery('friends');
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
        exports.database.createDocument(newFriend);
        resolve('Added New Friend');
    });
};
exports.removeFriend = function (targetId) {
    return new Promise(function (resolve, reject) {
        exports.database.deleteDocument(targetId);
        resolve('Removed Friend');
    });
};
exports.updateFriend = function (targetId, newProperties) {
    return new Promise(function (resolve, reject) {
        exports.database.updateDocument(targetId, newProperties);
        resolve('Edited Friend');
    });
};
// Messages related data
exports.sendMessage = function (chatId, messageText) {
    return new Promise(function (resolve, reject) {
        var newMessage = new app_data_model_1.Message(messageText, true);
        var newFriendDocument = exports.database.getDocument(chatId);
        newFriendDocument.messages.push(newMessage);
        exports.database.updateDocument(chatId, newFriendDocument);
        resolve('Sending');
    });
};
// Random utility functions
function getRandomishString() {
    return Math.random().toString(36).slice(2);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBeUQ7QUFDekQsaUVBQW1EO0FBRW5ELG1EQUFtRDtBQUVuRCx1QkFBdUI7QUFDdkIsT0FBTztBQUNQLEdBQUc7QUFDSCw2SUFBNkk7QUFDN0ksMkhBQTJIO0FBQzNILGtJQUFrSTtBQUNsSSxrSUFBa0k7QUFDbEksb0lBQW9JO0FBQ3BJLEdBQUc7QUFDSCx1QkFBdUI7QUFHdkIsa0NBQWtDO0FBQ2xDLElBQU0sU0FBUyxHQUFHO0lBQ2QsT0FBTyxFQUFFLGNBQWM7Q0FDMUIsQ0FBQTtBQUVVLFFBQUEsUUFBUSxHQUFHLElBQUksa0NBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7QUFHdkQscUJBQXFCO0FBQ3JCLGdCQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsVUFBQyxRQUFRLEVBQUUsT0FBTztJQUNsRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUssZ0NBQWdDO0lBQzFGLENBQUM7SUFBQSxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFFSCw4QkFBOEI7QUFDOUIscUdBQXFHO0FBQ3JHLDhCQUE4QjtBQUc5QixzREFBc0Q7QUFFM0MsUUFBQSxXQUFXLEdBQUc7SUFDckIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFDL0IsSUFBSSxjQUFjLEdBQUcsZ0JBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFeEQsbUZBQW1GO1FBQ25GLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDakIsNERBQTREO1lBQzVELFFBQVEs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LFlBQVksR0FBRyxVQUFVLFFBQWdCLEVBQUUsYUFBcUI7SUFDdkUsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IsZ0JBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRWpELE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUM3QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUdELHdCQUF3QjtBQUViLFFBQUEsV0FBVyxHQUFHLFVBQVUsTUFBYyxFQUFFLFdBQW1CO0lBQ2xFLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLElBQUksVUFBVSxHQUFHLElBQUksd0JBQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEQsSUFBSSxpQkFBaUIsR0FBRyxnQkFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRCxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVDLGdCQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUdELDJCQUEyQjtBQUMzQjtJQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZmlyZWJhc2UgZnJvbSAnbmF0aXZlc2NyaXB0LXBsdWdpbi1maXJlYmFzZSc7XG5pbXBvcnQgeyBDb3VjaGJhc2UgfSBmcm9tICduYXRpdmVzY3JpcHQtY291Y2hiYXNlJztcblxuaW1wb3J0IHsgRnJpZW5kLCBNZXNzYWdlIH0gZnJvbSAnLi9hcHAtZGF0YS1tb2RlbCc7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBBUEk6XG4vLyBcbi8vIGluaXRGcmllbmRzRGF0YSgpLnRoZW4oPGRvIHN0dWZmPikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBpbml0YWxpc2VzIHRoZSBEYXRhYmFzZSBhbmQgdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gZ2V0RnJpZW5kc0xpc3QoKS50aGVuKCBmcmllbmRzTGlzdCA9PiB7IDxkbyBzdHVmZiB3aXRoIGZyaWVuZHNMaXN0IEFycmF5PiB9ICkgICAgICAgIC0tIGdldHMgdGhlIGZyaWVuZHNMaXN0IGFzIGFuIEFycmF5XG4vLyBhZGRGcmllbmQoPGZyaWVuZCBuaWNrbmFtZT4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyByZW1vdmVGcmllbmQoPGZyaWVuZCBfaWQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyB1cGRhdGVGcmllbmQoPGZyaWVuZCBfaWQ+LCA8bmV3IGRhdGEgY29udGVudD4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBDb3VjaGJhc2UgaW5pdGlhbCBjb25maWd1cmF0aW9uXG5jb25zdCBEQl9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ2NvdWNoYmFzZS5kYicsXG59XG5cbmV4cG9ydCB2YXIgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcblxuXG4vLyBQcmUtZGVmaW5lIFF1ZXJpZXNcbmRhdGFiYXNlLmNyZWF0ZVZpZXcoJ2ZyaWVuZHMnLCAnMScsIChkb2N1bWVudCwgZW1pdHRlcikgPT4ge1xuICAgIGlmIChkb2N1bWVudC5kb2N1bWVudFR5cGUgPT09ICdGcmllbmQnKSB7XG4gICAgICAgIGVtaXR0ZXIuZW1pdChkb2N1bWVudC50aW1lTGFzdE1lc3NhZ2UsIGRvY3VtZW50KTsgICAgIC8vIGNhbGwgYmFjayB3aXRoIHRoaXMgZG9jdW1lbnQ7XG4gICAgfTtcbn0pO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGV4cG9zZWQgdG8gYWxsIG90aGVyIFZpZXdzLCB3aGljaCBhYnN0cmFjdCBhd2F5IGNvbXBsZXRlbHkgZnJvbSB0aGUgREIgYmFja2VuZC4gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBHZW5lcmFsIEFwcCBkZXRhaWxzIGRhdGEgYW5kIERhdGFiYXNlIGluaXRhbGlzYXRpb25cblxuZXhwb3J0IHZhciBpbml0QXBwRGF0YSA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgYXBwRG9jdW1lbnRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgIC8vIElmIHRoZSBkYXRhYmFzZSBoYXMgYWxyZWFkeSBiZWVuIGluaXRpYWxpc2VkLCByZS1sb2dpbiB3aXRoIEZpcmViYXNlIGFuZCByZXNvbHZlXG4gICAgICAgIGlmIChhcHBEb2N1bWVudFJlZikge1xuICAgICAgICAgICAgLy8gVGhlbiBjb25uZWN0IHRvIGZpcmViYXNlIGFuZCBsb2cgaW4gd2l0aCBBbm5vbnltb3VzIExvZ2luXG4gICAgICAgICAgICBmaXJlYmFzZS5sb2dpbih7XG4gICAgICAgICAgICAgICAgdHlwZTogZmlyZWJhc2UuTG9naW5UeXBlLlBBU1NXT1JELFxuICAgICAgICAgICAgICAgIGVtYWlsOiBhcHBEb2N1bWVudFJlZi5zZXR0aW5ncy5yYW5kb21JZGVudGl0eS5lbWFpbCxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogYXBwRG9jdW1lbnRSZWYuc2V0dGluZ3MucmFuZG9tSWRlbnRpdHkucGFzc3dvcmRcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4odXNlciA9PiB7XG5cbiAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvcjogJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGluaXRpYWxpc2VkLicpOyAgICAgICAgICAgLy8gZG8gbm90IHdhaXQgZm9yIGZpcmViYXNlIC0gdXNlciBzaG91bGQgYmUgYWJsZSB0byBzZWUgbG9jYWwgZGF0YVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRWxzZSBjcmVhdGUgbmV3IHJhbmRvbS9hbm9ueW1vdXMgdXNlciwgaW5pdGFsaXNlIHRoZSBBcHAgRG9jdW1lbnQgd2l0aCB0aG9zZSBkZXRhaWxzIGFuZCBwcm9jZWVkXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJhbmRvbUVtYWlsID0gZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyAnQHNxdWVhay5jb20nO1xuICAgICAgICAgICAgdmFyIHJhbmRvbVBhc3N3b3JkID0gZ2V0UmFuZG9taXNoU3RyaW5nKCkgKyBnZXRSYW5kb21pc2hTdHJpbmcoKTtcblxuICAgICAgICAgICAgZmlyZWJhc2UuY3JlYXRlVXNlcih7XG4gICAgICAgICAgICAgICAgZW1haWw6IHJhbmRvbUVtYWlsLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkOiByYW5kb21QYXNzd29yZFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwTmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmRvbUlkZW50aXR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiByYW5kb21FbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHJhbmRvbVBhc3N3b3JkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCAnc3F1ZWFrLWFwcCcpO1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgnTmV3IEFub255bW91cyBpZGVudGl0eSBjcmVhdGVkIScpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCdBcHAgRGF0YSBpbml0aWFsaXNlZC4nKTtcbiAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvcjogJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5cbi8vIEZyaWVuZHMgTGlzdCByZWxhdGVkIGRhdGFcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZyaWVuZChmcmllbmRJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGRhdGFiYXNlLmdldERvY3VtZW50KGZyaWVuZElkKTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIGZyaWVuZHNMaXN0UXVlcnkgPSBkYXRhYmFzZS5leGVjdXRlUXVlcnkoJ2ZyaWVuZHMnKTtcbiAgICAgICAgaWYgKGZyaWVuZHNMaXN0UXVlcnkpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZnJpZW5kc0xpc3RRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoJ0NvdWxkIG5vdCBvYnRhaW4gTGlzdCBvZiBGcmllbmRzIGZyb20gRGF0YWJhc2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChuaWNrbmFtZTogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgbmV3RnJpZW5kID0gbmV3IEZyaWVuZChuaWNrbmFtZSk7XG4gICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KG5ld0ZyaWVuZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnQWRkZWQgTmV3IEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnUmVtb3ZlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciB1cGRhdGVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG4gICAgICAgIHZhciBuZXdGcmllbmREb2N1bWVudCA9IGRhdGFiYXNlLmdldERvY3VtZW50KGNoYXRJZCk7XG4gICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICByZXNvbHZlKCdTZW5kaW5nJyk7XG4gICAgfSk7XG59XG5cblxuLy8gUmFuZG9tIHV0aWxpdHkgZnVuY3Rpb25zXG5mdW5jdGlvbiBnZXRSYW5kb21pc2hTdHJpbmcoKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xufSJdfQ==