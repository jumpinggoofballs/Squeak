"use strict";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxtREFBbUQ7QUFFbkQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLG9JQUFvSTtBQUNwSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxpRUFBbUQ7QUFDbkQsSUFBTSxTQUFTLEdBQUc7SUFDZCxPQUFPLEVBQUUsY0FBYztDQUMxQixDQUFBO0FBRVUsUUFBQSxRQUFRLEdBQUcsSUFBSSxrQ0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUd2RCxxQkFBcUI7QUFDckIsZ0JBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxVQUFDLFFBQVEsRUFBRSxPQUFPO0lBQ2xELEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBSyxnQ0FBZ0M7SUFDMUYsQ0FBQztJQUFBLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQztBQUVILDhCQUE4QjtBQUM5QixxR0FBcUc7QUFDckcsOEJBQThCO0FBRzlCLHNEQUFzRDtBQUUzQyxRQUFBLFdBQVcsR0FBRztJQUNyQixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUMvQixJQUFJLGNBQWMsR0FBRyxnQkFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUV4RCwyRUFBMkU7UUFDM0UsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUNqQixPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBR0QsSUFBSSxDQUFDLENBQUM7WUFDRixnQkFBUSxDQUFDLGNBQWMsQ0FBQztnQkFDcEIsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLFFBQVEsRUFBRSxFQUFFO2FBQ2YsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVqQixPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFHRCw0QkFBNEI7QUFFNUIsbUJBQTBCLFFBQWdCO0lBQ3RDLE1BQU0sQ0FBQyxnQkFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBRkQsOEJBRUM7QUFFVSxRQUFBLGNBQWMsR0FBRztJQUN4QixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUUvQixJQUFJLGdCQUFnQixHQUFHLGdCQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUNuQixPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBQ0QsSUFBSSxDQUFDLENBQUM7WUFDRixNQUFNLENBQUMsZ0RBQWdELENBQUMsQ0FBQztRQUM3RCxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFFVSxRQUFBLFNBQVMsR0FBRyxVQUFVLFFBQWdCO0lBQzdDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBRS9CLElBQUksU0FBUyxHQUFHLElBQUksdUJBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxnQkFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVuQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUVVLFFBQUEsWUFBWSxHQUFHLFVBQVUsUUFBZ0I7SUFDaEQsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IsZ0JBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFbEMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFFVSxRQUFBLFlBQVksR0FBRyxVQUFVLFFBQWdCLEVBQUUsYUFBcUI7SUFDdkUsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IsZ0JBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRWpELE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUM3QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUdELHdCQUF3QjtBQUViLFFBQUEsV0FBVyxHQUFHLFVBQVUsTUFBYyxFQUFFLFdBQW1CO0lBQ2xFLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLElBQUksVUFBVSxHQUFHLElBQUksd0JBQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEQsSUFBSSxpQkFBaUIsR0FBRyxnQkFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRCxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVDLGdCQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZyaWVuZCwgTWVzc2FnZSB9IGZyb20gJy4vYXBwLWRhdGEtbW9kZWwnO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gQVBJOlxuLy8gXG4vLyBpbml0RnJpZW5kc0RhdGEoKS50aGVuKDxkbyBzdHVmZj4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gaW5pdGFsaXNlcyB0aGUgRGF0YWJhc2UgYW5kIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIGdldEZyaWVuZHNMaXN0KCkudGhlbiggZnJpZW5kc0xpc3QgPT4geyA8ZG8gc3R1ZmYgd2l0aCBmcmllbmRzTGlzdCBBcnJheT4gfSApICAgICAgICAtLSBnZXRzIHRoZSBmcmllbmRzTGlzdCBhcyBhbiBBcnJheVxuLy8gYWRkRnJpZW5kKDxmcmllbmQgbmlja25hbWU+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gcmVtb3ZlRnJpZW5kKDxmcmllbmQgX2lkPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gdXBkYXRlRnJpZW5kKDxmcmllbmQgX2lkPiwgPG5ldyBkYXRhIGNvbnRlbnQ+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gQ291Y2hiYXNlIGluaXRpYWwgY29uZmlndXJhdGlvblxuaW1wb3J0IHsgQ291Y2hiYXNlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWNvdWNoYmFzZSc7XG5jb25zdCBEQl9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ2NvdWNoYmFzZS5kYicsXG59XG5cbmV4cG9ydCB2YXIgZGF0YWJhc2UgPSBuZXcgQ291Y2hiYXNlKERCX2NvbmZpZy5kYl9uYW1lKTtcblxuXG4vLyBQcmUtZGVmaW5lIFF1ZXJpZXNcbmRhdGFiYXNlLmNyZWF0ZVZpZXcoJ2ZyaWVuZHMnLCAnMScsIChkb2N1bWVudCwgZW1pdHRlcikgPT4ge1xuICAgIGlmIChkb2N1bWVudC5kb2N1bWVudFR5cGUgPT09ICdGcmllbmQnKSB7XG4gICAgICAgIGVtaXR0ZXIuZW1pdChkb2N1bWVudC50aW1lTGFzdE1lc3NhZ2UsIGRvY3VtZW50KTsgICAgIC8vIGNhbGwgYmFjayB3aXRoIHRoaXMgZG9jdW1lbnQ7XG4gICAgfTtcbn0pO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGV4cG9zZWQgdG8gYWxsIG90aGVyIFZpZXdzLCB3aGljaCBhYnN0cmFjdCBhd2F5IGNvbXBsZXRlbHkgZnJvbSB0aGUgREIgYmFja2VuZC4gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBHZW5lcmFsIEFwcCBkZXRhaWxzIGRhdGEgYW5kIERhdGFiYXNlIGluaXRhbGlzYXRpb25cblxuZXhwb3J0IHZhciBpbml0QXBwRGF0YSA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgYXBwRG9jdW1lbnRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgIC8vIElmIHRoZSBkYXRhYmFzZSBoYXMgYWxyZWFkeSBiZWVuIGluaXRpYWxpc2VkLCByZXNvbHZlIGFuZCBnZXQgb24gd2l0aCBpdFxuICAgICAgICBpZiAoYXBwRG9jdW1lbnRSZWYpIHtcbiAgICAgICAgICAgIHJlc29sdmUoJ0FwcCBEYXRhIGFscmVhZHkgaW5pdGlhbGlzZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbHNlIGNyZWF0ZSB0aGUgaW5pdGlhbGlzYXRpb24gZG9jdW1lbnRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudCh7XG4gICAgICAgICAgICAgICAgYXBwTmFtZTogJ1NxdWVhaycsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHt9XG4gICAgICAgICAgICB9LCAnc3F1ZWFrLWFwcCcpO1xuXG4gICAgICAgICAgICByZXNvbHZlKCdBcHAgRGF0YSBjcmVhdGVkIGFuZXcuJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuXG4vLyBGcmllbmRzIExpc3QgcmVsYXRlZCBkYXRhXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGcmllbmQoZnJpZW5kSWQ6IHN0cmluZykge1xuICAgIHJldHVybiBkYXRhYmFzZS5nZXREb2N1bWVudChmcmllbmRJZCk7XG59XG5cbmV4cG9ydCB2YXIgZ2V0RnJpZW5kc0xpc3QgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IGZyaWVuZHNMaXN0OiBBcnJheTxPYmplY3Q+IH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBmcmllbmRzTGlzdFF1ZXJ5ID0gZGF0YWJhc2UuZXhlY3V0ZVF1ZXJ5KCdmcmllbmRzJyk7XG4gICAgICAgIGlmIChmcmllbmRzTGlzdFF1ZXJ5KSB7XG4gICAgICAgICAgICByZXNvbHZlKGZyaWVuZHNMaXN0UXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KCdDb3VsZCBub3Qgb2J0YWluIExpc3Qgb2YgRnJpZW5kcyBmcm9tIERhdGFiYXNlJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBhZGRGcmllbmQgPSBmdW5jdGlvbiAobmlja25hbWU6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgdmFyIG5ld0ZyaWVuZCA9IG5ldyBGcmllbmQobmlja25hbWUpO1xuICAgICAgICBkYXRhYmFzZS5jcmVhdGVEb2N1bWVudChuZXdGcmllbmQpO1xuXG4gICAgICAgIHJlc29sdmUoJ0FkZGVkIE5ldyBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciByZW1vdmVGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgZGF0YWJhc2UuZGVsZXRlRG9jdW1lbnQodGFyZ2V0SWQpO1xuXG4gICAgICAgIHJlc29sdmUoJ1JlbW92ZWQgRnJpZW5kJyk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgdXBkYXRlRnJpZW5kID0gZnVuY3Rpb24gKHRhcmdldElkOiBzdHJpbmcsIG5ld1Byb3BlcnRpZXM6IE9iamVjdCk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQodGFyZ2V0SWQsIG5ld1Byb3BlcnRpZXMpO1xuXG4gICAgICAgIHJlc29sdmUoJ0VkaXRlZCBGcmllbmQnKTtcbiAgICB9KTtcbn1cblxuXG4vLyBNZXNzYWdlcyByZWxhdGVkIGRhdGFcblxuZXhwb3J0IHZhciBzZW5kTWVzc2FnZSA9IGZ1bmN0aW9uIChjaGF0SWQ6IHN0cmluZywgbWVzc2FnZVRleHQ6IHN0cmluZyk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHZhciBuZXdNZXNzYWdlID0gbmV3IE1lc3NhZ2UobWVzc2FnZVRleHQsIHRydWUpO1xuICAgICAgICB2YXIgbmV3RnJpZW5kRG9jdW1lbnQgPSBkYXRhYmFzZS5nZXREb2N1bWVudChjaGF0SWQpO1xuICAgICAgICBuZXdGcmllbmREb2N1bWVudC5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudChjaGF0SWQsIG5ld0ZyaWVuZERvY3VtZW50KTtcbiAgICAgICAgcmVzb2x2ZSgnU2VuZGluZycpO1xuICAgIH0pO1xufSJdfQ==