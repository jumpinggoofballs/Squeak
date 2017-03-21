"use strict";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxtREFBbUQ7QUFFbkQsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLGtDQUFrQztBQUNsQyxpRUFBbUQ7QUFDbkQsSUFBTSxTQUFTLEdBQUc7SUFDZCxPQUFPLEVBQUUsY0FBYztDQUMxQixDQUFBO0FBRVUsUUFBQSxRQUFRLEdBQUcsSUFBSSxrQ0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUd2RCxxQkFBcUI7QUFDckIsZ0JBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxVQUFDLFFBQVEsRUFBRSxPQUFPO0lBQ2xELEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBSyxnQ0FBZ0M7SUFDMUYsQ0FBQztJQUFBLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQztBQUVILDhCQUE4QjtBQUM5QixxR0FBcUc7QUFDckcsOEJBQThCO0FBRzlCLHNEQUFzRDtBQUUzQyxRQUFBLFdBQVcsR0FBRztJQUNyQixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUMvQixJQUFJLGNBQWMsR0FBRyxnQkFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUV4RCwyRUFBMkU7UUFDM0UsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUNqQixPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBR0QsSUFBSSxDQUFDLENBQUM7WUFDRixnQkFBUSxDQUFDLGNBQWMsQ0FBQztnQkFDcEIsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLFFBQVEsRUFBRSxFQUFFO2FBQ2YsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVqQixPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFHRCw0QkFBNEI7QUFFNUIsbUJBQTBCLFFBQWdCO0lBQ3RDLE1BQU0sQ0FBQyxnQkFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBRkQsOEJBRUM7QUFFVSxRQUFBLGNBQWMsR0FBRztJQUN4QixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUUvQixJQUFJLGdCQUFnQixHQUFHLGdCQUFRLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUNuQixPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBQ0QsSUFBSSxDQUFDLENBQUM7WUFDRixNQUFNLENBQUMsZ0RBQWdELENBQUMsQ0FBQztRQUM3RCxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFFVSxRQUFBLFNBQVMsR0FBRyxVQUFVLFFBQWdCO0lBQzdDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBRS9CLElBQUksU0FBUyxHQUFHLElBQUksdUJBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxnQkFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVuQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUVVLFFBQUEsWUFBWSxHQUFHLFVBQVUsUUFBZ0I7SUFDaEQsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IsZ0JBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFbEMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFFVSxRQUFBLFVBQVUsR0FBRyxVQUFVLFFBQWdCLEVBQUUsYUFBcUI7SUFDckUsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IsZ0JBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRWpELE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUM3QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUdELHdCQUF3QjtBQUViLFFBQUEsV0FBVyxHQUFHLFVBQVUsTUFBYyxFQUFFLFdBQW1CO0lBQ2xFLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLElBQUksVUFBVSxHQUFHLElBQUksd0JBQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEQsSUFBSSxpQkFBaUIsR0FBRyxnQkFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRCxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVDLGdCQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZyaWVuZCwgTWVzc2FnZSB9IGZyb20gJy4vYXBwLWRhdGEtbW9kZWwnO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gQVBJOlxuLy8gXG4vLyBpbml0RnJpZW5kc0RhdGEoKS50aGVuKDxkbyBzdHVmZj4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gaW5pdGFsaXNlcyB0aGUgRGF0YWJhc2UgYW5kIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIGdldEZyaWVuZHNMaXN0KCkudGhlbiggZnJpZW5kc0xpc3QgPT4geyA8ZG8gc3R1ZmYgd2l0aCBmcmllbmRzTGlzdCBBcnJheT4gfSApICAgICAgICAtLSBnZXRzIHRoZSBmcmllbmRzTGlzdCBhcyBhbiBBcnJheVxuLy8gYWRkRnJpZW5kKDxmcmllbmQgbmlja25hbWU+KS50aGVuKCBsb2dNZXNzYWdlID0+IHs8b3B0aW9uYWw+fSkgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gcmVtb3ZlRnJpZW5kKDxmcmllbmQgX2lkPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gZWRpdEZyaWVuZCg8ZnJpZW5kIF9pZD4sIDxuZXcgZGF0YSBjb250ZW50PikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgIC0tIGFkZHMgYSBGcmllbmQgdG8gdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8vIENvdWNoYmFzZSBpbml0aWFsIGNvbmZpZ3VyYXRpb25cbmltcG9ydCB7IENvdWNoYmFzZSB9IGZyb20gJ25hdGl2ZXNjcmlwdC1jb3VjaGJhc2UnO1xuY29uc3QgREJfY29uZmlnID0ge1xuICAgIGRiX25hbWU6ICdjb3VjaGJhc2UuZGInLFxufVxuXG5leHBvcnQgdmFyIGRhdGFiYXNlID0gbmV3IENvdWNoYmFzZShEQl9jb25maWcuZGJfbmFtZSk7XG5cblxuLy8gUHJlLWRlZmluZSBRdWVyaWVzXG5kYXRhYmFzZS5jcmVhdGVWaWV3KCdmcmllbmRzJywgJzEnLCAoZG9jdW1lbnQsIGVtaXR0ZXIpID0+IHtcbiAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRUeXBlID09PSAnRnJpZW5kJykge1xuICAgICAgICBlbWl0dGVyLmVtaXQoZG9jdW1lbnQudGltZUxhc3RNZXNzYWdlLCBkb2N1bWVudCk7ICAgICAvLyBjYWxsIGJhY2sgd2l0aCB0aGlzIGRvY3VtZW50O1xuICAgIH07XG59KTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBVdGlsaXR5IGZ1bmN0aW9ucyBleHBvc2VkIHRvIGFsbCBvdGhlciBWaWV3cywgd2hpY2ggYWJzdHJhY3QgYXdheSBjb21wbGV0ZWx5IGZyb20gdGhlIERCIGJhY2tlbmQuIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gR2VuZXJhbCBBcHAgZGV0YWlscyBkYXRhIGFuZCBEYXRhYmFzZSBpbml0YWxpc2F0aW9uXG5cbmV4cG9ydCB2YXIgaW5pdEFwcERhdGEgPSBmdW5jdGlvbiAoKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIGFwcERvY3VtZW50UmVmID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKTtcblxuICAgICAgICAvLyBJZiB0aGUgZGF0YWJhc2UgaGFzIGFscmVhZHkgYmVlbiBpbml0aWFsaXNlZCwgcmVzb2x2ZSBhbmQgZ2V0IG9uIHdpdGggaXRcbiAgICAgICAgaWYgKGFwcERvY3VtZW50UmVmKSB7XG4gICAgICAgICAgICByZXNvbHZlKCdBcHAgRGF0YSBhbHJlYWR5IGluaXRpYWxpc2VkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRWxzZSBjcmVhdGUgdGhlIGluaXRpYWxpc2F0aW9uIGRvY3VtZW50XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQoe1xuICAgICAgICAgICAgICAgIGFwcE5hbWU6ICdTcXVlYWsnLFxuICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7fVxuICAgICAgICAgICAgfSwgJ3NxdWVhay1hcHAnKTtcblxuICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIERhdGEgY3JlYXRlZCBhbmV3LicpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblxuLy8gRnJpZW5kcyBMaXN0IHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RnJpZW5kKGZyaWVuZElkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoZnJpZW5kSWQpO1xufVxuXG5leHBvcnQgdmFyIGdldEZyaWVuZHNMaXN0ID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyBmcmllbmRzTGlzdDogQXJyYXk8T2JqZWN0PiB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgZnJpZW5kc0xpc3RRdWVyeSA9IGRhdGFiYXNlLmV4ZWN1dGVRdWVyeSgnZnJpZW5kcycpO1xuICAgICAgICBpZiAoZnJpZW5kc0xpc3RRdWVyeSkge1xuICAgICAgICAgICAgcmVzb2x2ZShmcmllbmRzTGlzdFF1ZXJ5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdCgnQ291bGQgbm90IG9idGFpbiBMaXN0IG9mIEZyaWVuZHMgZnJvbSBEYXRhYmFzZScpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgYWRkRnJpZW5kID0gZnVuY3Rpb24gKG5pY2tuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIHZhciBuZXdGcmllbmQgPSBuZXcgRnJpZW5kKG5pY2tuYW1lKTtcbiAgICAgICAgZGF0YWJhc2UuY3JlYXRlRG9jdW1lbnQobmV3RnJpZW5kKTtcblxuICAgICAgICByZXNvbHZlKCdBZGRlZCBOZXcgRnJpZW5kJyk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB2YXIgcmVtb3ZlRnJpZW5kID0gZnVuY3Rpb24gKHRhcmdldElkOiBzdHJpbmcpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIGRhdGFiYXNlLmRlbGV0ZURvY3VtZW50KHRhcmdldElkKTtcblxuICAgICAgICByZXNvbHZlKCdSZW1vdmVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIGVkaXRGcmllbmQgPSBmdW5jdGlvbiAodGFyZ2V0SWQ6IHN0cmluZywgbmV3UHJvcGVydGllczogT2JqZWN0KTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCh0YXJnZXRJZCwgbmV3UHJvcGVydGllcyk7XG5cbiAgICAgICAgcmVzb2x2ZSgnRWRpdGVkIEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5cbi8vIE1lc3NhZ2VzIHJlbGF0ZWQgZGF0YVxuXG5leHBvcnQgdmFyIHNlbmRNZXNzYWdlID0gZnVuY3Rpb24gKGNoYXRJZDogc3RyaW5nLCBtZXNzYWdlVGV4dDogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdmFyIG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZShtZXNzYWdlVGV4dCwgdHJ1ZSk7XG4gICAgICAgIHZhciBuZXdGcmllbmREb2N1bWVudCA9IGRhdGFiYXNlLmdldERvY3VtZW50KGNoYXRJZCk7XG4gICAgICAgIG5ld0ZyaWVuZERvY3VtZW50Lm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG4gICAgICAgIGRhdGFiYXNlLnVwZGF0ZURvY3VtZW50KGNoYXRJZCwgbmV3RnJpZW5kRG9jdW1lbnQpO1xuICAgICAgICByZXNvbHZlKCdTZW5kaW5nJyk7XG4gICAgfSk7XG59Il19