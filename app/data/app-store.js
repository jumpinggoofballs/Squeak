"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var app_data_model_1 = require("./app-data-model");
///////////////////////
// API:
// 
// initFriendsData().then(<do stuff>)                                                   -- initalises the Database and the Friends Data Table
// getFriendsList().then( friendsList => { <do stuff with friendsList Array> } )        -- gets the friendsList as an Array
// addFriend(<friend nickname>).then( logMessage => {<optional>})                       -- adds a Friend to the Friends Data Table
// removeFriend(<friend _id>).then( logMessage => {<optional>})                         -- adds a Friend to the Friends Data Table
// editFriend(<friend _id>, <new data content>).then( logMessage => {<optional>})       -- adds a Friend to the Friends Data Table
// 
///////////////////////
// Couchbase initial configuration
var nativescript_couchbase_1 = require("nativescript-couchbase");
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
        // If the database has already been initialised, resolve and get on with it
        if (appDocumentRef) {
            resolve('App Data already initialised.');
        }
        else {
            exports.database.createDocument({
                appName: 'Squeak',
                settings: {}
            }, 'squeak-app');
            resolve('App Data created anew.');
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
        var newFriend = __assign({}, new app_data_model_1.Friend(nickname), { documentType: 'Friend' });
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
exports.editFriend = function (targetId, newProperties) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLG1EQUFtRDtBQUVuRCx1QkFBdUI7QUFDdkIsT0FBTztBQUNQLEdBQUc7QUFDSCw2SUFBNkk7QUFDN0ksMkhBQTJIO0FBQzNILGtJQUFrSTtBQUNsSSxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLEdBQUc7QUFDSCx1QkFBdUI7QUFHdkIsa0NBQWtDO0FBQ2xDLGlFQUFtRDtBQUNuRCxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFFVSxRQUFBLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBR3ZELHFCQUFxQjtBQUNyQixnQkFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLFVBQUMsUUFBUSxFQUFFLE9BQU87SUFDbEQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFLLGdDQUFnQztJQUMxRixDQUFDO0lBQUEsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBRUgsOEJBQThCO0FBQzlCLHFHQUFxRztBQUNyRyw4QkFBOEI7QUFHOUIsc0RBQXNEO0FBRTNDLFFBQUEsV0FBVyxHQUFHO0lBQ3JCLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLElBQUksY0FBYyxHQUFHLGdCQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXhELDJFQUEyRTtRQUMzRSxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFHRCxJQUFJLENBQUMsQ0FBQztZQUNGLGdCQUFRLENBQUMsY0FBYyxDQUFDO2dCQUNwQixPQUFPLEVBQUUsUUFBUTtnQkFDakIsUUFBUSxFQUFFLEVBQUU7YUFDZixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRWpCLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUdELDRCQUE0QjtBQUU1QixtQkFBMEIsUUFBZ0I7SUFDdEMsTUFBTSxDQUFDLGdCQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFGRCw4QkFFQztBQUVVLFFBQUEsY0FBYyxHQUFHO0lBQ3hCLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBRS9CLElBQUksZ0JBQWdCLEdBQUcsZ0JBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEQsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ25CLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFDRCxJQUFJLENBQUMsQ0FBQztZQUNGLE1BQU0sQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1FBQzdELENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUVVLFFBQUEsU0FBUyxHQUFHLFVBQVUsUUFBZ0I7SUFDN0MsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IsSUFBSSxTQUFTLGdCQUNOLElBQUksdUJBQU0sQ0FBQyxRQUFRLENBQUMsSUFDdkIsWUFBWSxFQUFFLFFBQVEsR0FDekIsQ0FBQTtRQUNELGdCQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRW5DLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBRVUsUUFBQSxZQUFZLEdBQUcsVUFBVSxRQUFnQjtJQUNoRCxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUUvQixnQkFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVsQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUM5QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUVVLFFBQUEsVUFBVSxHQUFHLFVBQVUsUUFBZ0IsRUFBRSxhQUFxQjtJQUNyRSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUUvQixnQkFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFakQsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzdCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBR0Qsd0JBQXdCO0FBRWIsUUFBQSxXQUFXLEdBQUcsVUFBVSxNQUFjLEVBQUUsV0FBbUI7SUFDbEUsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFDL0IsSUFBSSxVQUFVLEdBQUcsSUFBSSx3QkFBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoRCxJQUFJLGlCQUFpQixHQUFHLGdCQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUMsZ0JBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDbkQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRnJpZW5kLCBNZXNzYWdlIH0gZnJvbSAnLi9hcHAtZGF0YS1tb2RlbCc7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBBUEk6XG4vLyBcbi8vIGluaXRGcmllbmRzRGF0YSgpLnRoZW4oPGRvIHN0dWZmPikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBpbml0YWxpc2VzIHRoZSBEYXRhYmFzZSBhbmQgdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gZ2V0RnJpZW5kc0xpc3QoKS50aGVuKCBmcmllbmRzTGlzdCA9PiB7IDxkbyBzdHVmZiB3aXRoIGZyaWVuZHNMaXN0IEFycmF5PiB9ICkgICAgICAgIC0tIGdldHMgdGhlIGZyaWVuZHNMaXN0IGFzIGFuIEFycmF5XG4vLyBhZGRGcmllbmQoPGZyaWVuZCBuaWNrbmFtZT4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyByZW1vdmVGcmllbmQoPGZyaWVuZCBfaWQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBlZGl0RnJpZW5kKDxmcmllbmQgX2lkPiwgPG5ldyBkYXRhIGNvbnRlbnQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gQ291Y2hiYXNlIGluaXRpYWwgY29uZmlndXJhdGlvblxuaW1wb3J0IHsgQ291Y2hiYXNlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWNvdWNoYmFzZSc7XG5jb25zdCBEQl9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ2NvdWNoYmFzZS5kYicsXG59XG5cbmV4cG9ydCB2YXIgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcblxuXG4vLyBQcmUtZGVmaW5lIFF1ZXJpZXNcbmRhdGFiYXNlLmNyZWF0ZVZpZXcoJ2ZyaWVuZHMnLCAnMScsIChkb2N1bWVudCwgZW1pdHRlcikgPT4ge1xuICAgIGlmIChkb2N1bWVudC5kb2N1bWVudFR5cGUgPT09ICdGcmllbmQnKSB7XG4gICAgICAgIGVtaXR0ZXIuZW1pdChkb2N1bWVudC50aW1lTGFzdE1lc3NhZ2UsIGRvY3VtZW50KTsgICAgIC8vIGNhbGwgYmFjayB3aXRoIHRoaXMgZG9jdW1lbnQ7XG4gICAgfTtcbn0pO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGV4cG9zZWQgdG8gYWxsIG90aGVyIFZpZXdzLCB3aGljaCBhYnN0cmFjdCBhd2F5IGNvbXBsZXRlbHkgZnJvbSB0aGUgREIgYmFja2VuZC4gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBHZW5lcmFsIEFwcCBkZXRhaWxzIGRhdGEgYW5kIERhdGFiYXNlIGluaXRhbGlzYXRpb25cblxuZXhwb3J0IHZhciBpbml0QXBwRGF0YSA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgYXBwRG9jdW1lbnRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgIC8vIElmIHRoZSBkYXRhYmFzZSBoYXMgYWxyZWFkeSBiZWVuIGluaXRpYWxpc2VkLCByZXNvbHZlIGFuZCBnZXQgb24gd2l0aCBpdFxuICAgICAgICBpZiAoYXBwRG9jdW1lbnRSZWYpIHtcbiAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGFscmVhZHkgaW5pdGlhbGlzZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbHNlIGNyZWF0ZSB0aGUgaW5pdGlhbGlzYXRpb24gZG9jdW1lbnRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudCh7XG4gICAgICAgICAgICAgICAgYXBwTmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHt9XG4gICAgICAgICAgICB9LCAnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgICAgICByZXNvbHZlKCdBcHAgRGF0YSBjcmVhdGVkIGFuZXcuJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuXG4vLyBGcmllbmRzIExpc3QgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGcmllbmQoZnJpZW5kSWQ6IHN0cmluZykge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmRJZCk7XG59XG5cbmV4cG9ydCB2YXIgZ2V0RnJpZW5kc0xpc3QgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IGZyaWVuZHNMaXN0OiBBcnJheTxPYmplY3Q+IH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBmcmllbmRzTGlzdFF1ZXJ5ID0gZGF0YWJhc2UuZXhlY3V0ZVF1ZXJ5KCdmcmllbmRzJyk7XG4gICAgICAgIGlmIChmcmllbmRzTGlzdFF1ZXJ5KSB7XG4gICAgICAgICAgICByZXNvbHZlKGZyaWVuZHNMaXN0UXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KCdDb3VsZCBub3Qgb2J0YWluIExpc3Qgb2YgRnJpZW5kcyBmcm9tIERhdGFiYXNlJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBhZGRGcmllbmQgPSBmdW5jdGlvbiAobmlja25hbWU6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG5ld0ZyaWVuZCA9IHtcbiAgICAgICAgICAgIC4uLm5ldyBGcmllbmQobmlja25hbWUpLFxuICAgICAgICAgICAgZG9jdW1lbnRUeXBlOiAnRnJpZW5kJ1xuICAgICAgICB9XG4gICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KG5ld0ZyaWVuZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnQWRkZWQgTmV3IEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJZDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS5kZWxldGVEb2N1bWVudCh0YXJnZXRJZCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnUmVtb3ZlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBlZGl0RnJpZW5kID0gZnVuY3Rpb24gKHRhcmdldElkOiBzdHJpbmcsIG5ld1Byb3BlcnRpZXM6IE9iamVjdCk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQodGFyZ2V0SWQsIG5ld1Byb3BlcnRpZXMpO1xuXG4gICAgICAgIHJlc29sdmUoJ0VkaXRlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuXG4vLyBNZXNzYWdlcyByZWxhdGVkIGRhdGFcblxuZXhwb3J0IHZhciBzZW5kTWVzc2FnZSA9IGZ1bmN0aW9uIChjaGF0SWQ6IHN0cmluZywgbWVzc2FnZVRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlID0gbmV3IE1lc3NhZ2UobWVzc2FnZVRleHQsIHRydWUpO1xuICAgICAgICB2YXIgbmV3RnJpZW5kRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudChjaGF0SWQpO1xuICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgcmVzb2x2ZSgnU2VuZGluZycpO1xuICAgIH0pO1xufSJdfQ==