"use strict";
var app_data_model_1 = require("./app-data-model");
///////////////////////
// API:
// 
// initFriendsData.then(<do stuff>)                                                     -- initalises the Database and the Friends Data Table
// getFriendsList.then( friendsList => { <do stuff with friendsList Array> } )          -- gets the friendsList as an Array
// addFriend(<friend nickname>).then( logMessage => {<optional>})                       -- adds a Friend to the Friends Data Table
// removeFriend(<friend index in Array>).then( logMessage => {<optional>})              -- adds a Friend to the Friends Data Table
// 
///////////////////////
// Couchbase initial configuration
var nativescript_couchbase_1 = require("nativescript-couchbase");
var DB_config = {
    db_name: 'couchbase.db',
};
var database = new nativescript_couchbase_1.Couchbase(DB_config.db_name);
var appDocumentRef = database.getDocument('squeak-app');
//////////////////////////////
// Utility functions exposed to all other Views, which abstract away completely from the DB backend. 
//////////////////////////////
// 1. Simple instructions which do not require paramenters
exports.initAppData = function () {
    return new Promise(function (resolve, reject) {
        if (appDocumentRef) {
            resolve('App Data already initialised.');
        }
        else {
            database.createDocument({
                appName: 'Squeak',
                settings: {},
                friendsList: []
            }, 'squeak-app');
            resolve('App Data created anew.');
        }
    });
};
exports.getFriendsList = function () {
    return new Promise(function (resolve, reject) {
        var friendsListQuery = database.getDocument('squeak-app').friendsList;
        if (friendsListQuery) {
            resolve(friendsListQuery);
        }
        else {
            reject('Could not obtain List of Friends from Database');
        }
    });
};
// 2. More complex operations that do require parameters
exports.addFriend = function (nickname) {
    return new Promise(function (resolve, reject) {
        var newAppDocument = appDocumentRef;
        var newFriendsList = database.getDocument('squeak-app').friendsList;
        var newFriend = new app_data_model_1.Friend(nickname);
        newFriendsList.push(newFriend);
        newAppDocument.friendsList = newFriendsList;
        database.updateDocument('squeak-app', newAppDocument);
        resolve('Added New Friend');
    });
};
exports.removeFriend = function (targetIndex) {
    return new Promise(function (resolve, reject) {
        var newAppDocument = appDocumentRef;
        var newFriendsList = database.getDocument('squeak-app').friendsList;
        newFriendsList.splice(targetIndex, 1);
        newAppDocument.friendsList = newFriendsList;
        database.updateDocument('squeak-app', newAppDocument);
        resolve('Removed Friend');
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxtREFBMEM7QUFFMUMsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxHQUFHO0FBQ0gsNklBQTZJO0FBQzdJLDJIQUEySDtBQUMzSCxrSUFBa0k7QUFDbEksa0lBQWtJO0FBQ2xJLEdBQUc7QUFDSCx1QkFBdUI7QUFHdkIsa0NBQWtDO0FBQ2xDLGlFQUFtRDtBQUNuRCxJQUFNLFNBQVMsR0FBRztJQUNkLE9BQU8sRUFBRSxjQUFjO0NBQzFCLENBQUE7QUFFRCxJQUFJLFFBQVEsR0FBRyxJQUFJLGtDQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2hELElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFeEQsOEJBQThCO0FBQzlCLHFHQUFxRztBQUNyRyw4QkFBOEI7QUFFOUIsMERBQTBEO0FBRS9DLFFBQUEsV0FBVyxHQUFHO0lBQ3JCLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDakIsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNELElBQUksQ0FBQyxDQUFDO1lBQ0YsUUFBUSxDQUFDLGNBQWMsQ0FBQztnQkFDcEIsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLFdBQVcsRUFBRSxFQUFFO2FBQ2xCLEVBQUUsWUFBWSxDQUFDLENBQUE7WUFDaEIsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDdEMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBRVUsUUFBQSxjQUFjLEdBQUc7SUFDeEIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFDL0IsSUFBSSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUN0RSxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDbkIsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNELElBQUksQ0FBQyxDQUFDO1lBQ0YsTUFBTSxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFDN0QsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBRUQsd0RBQXdEO0FBRTdDLFFBQUEsU0FBUyxHQUFHLFVBQVUsUUFBZ0I7SUFDN0MsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFFL0IsSUFBSSxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3BDLElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQ3BFLElBQUksU0FBUyxHQUFHLElBQUksdUJBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVyQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9CLGNBQWMsQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDO1FBQzVDLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRXRELE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBRVUsUUFBQSxZQUFZLEdBQUcsVUFBVSxXQUFtQjtJQUNuRCxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUUvQixJQUFJLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDcEMsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFFcEUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEMsY0FBYyxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUM7UUFDNUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFdEQsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBGcmllbmQgfSBmcm9tICcuL2FwcC1kYXRhLW1vZGVsJztcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEFQSTpcbi8vIFxuLy8gaW5pdEZyaWVuZHNEYXRhLnRoZW4oPGRvIHN0dWZmPikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGluaXRhbGlzZXMgdGhlIERhdGFiYXNlIGFuZCB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBnZXRGcmllbmRzTGlzdC50aGVuKCBmcmllbmRzTGlzdCA9PiB7IDxkbyBzdHVmZiB3aXRoIGZyaWVuZHNMaXN0IEFycmF5PiB9ICkgICAgICAgICAgLS0gZ2V0cyB0aGUgZnJpZW5kc0xpc3QgYXMgYW4gQXJyYXlcbi8vIGFkZEZyaWVuZCg8ZnJpZW5kIG5pY2tuYW1lPikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIHJlbW92ZUZyaWVuZCg8ZnJpZW5kIGluZGV4IGluIEFycmF5PikudGhlbiggbG9nTWVzc2FnZSA9PiB7PG9wdGlvbmFsPn0pICAgICAgICAgICAgICAtLSBhZGRzIGEgRnJpZW5kIHRvIHRoZSBGcmllbmRzIERhdGEgVGFibGVcbi8vIFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vLyBDb3VjaGJhc2UgaW5pdGlhbCBjb25maWd1cmF0aW9uXG5pbXBvcnQgeyBDb3VjaGJhc2UgfSBmcm9tICduYXRpdmVzY3JpcHQtY291Y2hiYXNlJztcbmNvbnN0IERCX2NvbmZpZyA9IHtcbiAgICBkYl9uYW1lOiAnY291Y2hiYXNlLmRiJyxcbn1cblxudmFyIGRhdGFiYXNlID0gbmV3IENvdWNoYmFzZShEQl9jb25maWcuZGJfbmFtZSk7XG52YXIgYXBwRG9jdW1lbnRSZWYgPSBkYXRhYmFzZS5nZXREb2N1bWVudCgnc3F1ZWFrLWFwcCcpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGV4cG9zZWQgdG8gYWxsIG90aGVyIFZpZXdzLCB3aGljaCBhYnN0cmFjdCBhd2F5IGNvbXBsZXRlbHkgZnJvbSB0aGUgREIgYmFja2VuZC4gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gMS4gU2ltcGxlIGluc3RydWN0aW9ucyB3aGljaCBkbyBub3QgcmVxdWlyZSBwYXJhbWVudGVyc1xuXG5leHBvcnQgdmFyIGluaXRBcHBEYXRhID0gZnVuY3Rpb24gKCk6IFByb21pc2U8eyBsb2dNZXNzYWdlOiBzdHJpbmcgfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmIChhcHBEb2N1bWVudFJlZikge1xuICAgICAgICAgICAgcmVzb2x2ZSgnQXBwIERhdGEgYWxyZWFkeSBpbml0aWFsaXNlZC4nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRhdGFiYXNlLmNyZWF0ZURvY3VtZW50KHtcbiAgICAgICAgICAgICAgICBhcHBOYW1lOiAnU3F1ZWFrJyxcbiAgICAgICAgICAgICAgICBzZXR0aW5nczoge30sXG4gICAgICAgICAgICAgICAgZnJpZW5kc0xpc3Q6IFtdXG4gICAgICAgICAgICB9LCAnc3F1ZWFrLWFwcCcpXG4gICAgICAgICAgICByZXNvbHZlKCdBcHAgRGF0YSBjcmVhdGVkIGFuZXcuJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHZhciBmcmllbmRzTGlzdFF1ZXJ5ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5mcmllbmRzTGlzdDtcbiAgICAgICAgaWYgKGZyaWVuZHNMaXN0UXVlcnkpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZnJpZW5kc0xpc3RRdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoJ0NvdWxkIG5vdCBvYnRhaW4gTGlzdCBvZiBGcmllbmRzIGZyb20gRGF0YWJhc2UnKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vLyAyLiBNb3JlIGNvbXBsZXggb3BlcmF0aW9ucyB0aGF0IGRvIHJlcXVpcmUgcGFyYW1ldGVyc1xuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChuaWNrbmFtZTogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgbmV3QXBwRG9jdW1lbnQgPSBhcHBEb2N1bWVudFJlZjtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZHNMaXN0ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5mcmllbmRzTGlzdDtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZCA9IG5ldyBGcmllbmQobmlja25hbWUpO1xuXG4gICAgICAgIG5ld0ZyaWVuZHNMaXN0LnB1c2gobmV3RnJpZW5kKTtcbiAgICAgICAgbmV3QXBwRG9jdW1lbnQuZnJpZW5kc0xpc3QgPSBuZXdGcmllbmRzTGlzdDtcbiAgICAgICAgZGF0YWJhc2UudXBkYXRlRG9jdW1lbnQoJ3NxdWVhay1hcHAnLCBuZXdBcHBEb2N1bWVudCk7XG5cbiAgICAgICAgcmVzb2x2ZSgnQWRkZWQgTmV3IEZyaWVuZCcpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgdmFyIHJlbW92ZUZyaWVuZCA9IGZ1bmN0aW9uICh0YXJnZXRJbmRleDogbnVtYmVyKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICB2YXIgbmV3QXBwRG9jdW1lbnQgPSBhcHBEb2N1bWVudFJlZjtcbiAgICAgICAgdmFyIG5ld0ZyaWVuZHNMaXN0ID0gZGF0YWJhc2UuZ2V0RG9jdW1lbnQoJ3NxdWVhay1hcHAnKS5mcmllbmRzTGlzdDtcblxuICAgICAgICBuZXdGcmllbmRzTGlzdC5zcGxpY2UodGFyZ2V0SW5kZXgsIDEpO1xuICAgICAgICBuZXdBcHBEb2N1bWVudC5mcmllbmRzTGlzdCA9IG5ld0ZyaWVuZHNMaXN0O1xuICAgICAgICBkYXRhYmFzZS51cGRhdGVEb2N1bWVudCgnc3F1ZWFrLWFwcCcsIG5ld0FwcERvY3VtZW50KTtcblxuICAgICAgICByZXNvbHZlKCdSZW1vdmVkIEZyaWVuZCcpO1xuICAgIH0pO1xufSJdfQ==