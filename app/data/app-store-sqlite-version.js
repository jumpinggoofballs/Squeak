"use strict";
///////////////////////
// API:
// 
// initFriendsData.then(<do stuff>)                                                     -- initalises the Database and the Friends Data Table
// getFriendsList.then( friendsList => { <do stuff with friendsList Array> } )          -- gets the friendsList as an Array
// addFriend(<friend nickname>).then( logMessage => {<optional>})                       -- adds a Friend to the Friends Data Table
// 
///////////////////////
// SQLite initial configuration
var Sqlite = require('nativescript-sqlite');
var SQL_config = {
    db_name: 'test.db',
};
// SQL_ prefix aliases : this is the only place in the application where one would have to define/interact directly with SQL queries
var initDB = new Sqlite(SQL_config.db_name);
function SQL_addFriendToDB(db, nickname) {
    return db.execSQL('INSERT INTO friends (nickname) VALUES (?)', [nickname]);
}
function SQL_getFriendsTable(db) {
    return db.all('SELECT * FROM friends');
}
function SQL_initFriendsTable(db) {
    return db.execSQL('CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT)');
}
// END OF SQL_ prefixes
//////////////////////////////
// Utility functions exposed to all other Views, which abstract away completely from the DB backend. 
//////////////////////////////
// 1. Simple instructions which do not require paramenters
exports.initFriendsData = function () {
    return new Promise(function (resolve, reject) {
        initDB
            .then(function (db) {
            SQL_initFriendsTable(db)
                .then(function () {
                resolve('Friends Table added successfully!');
            }, function (error) {
                reject('Failed to initialise the Friends Table: ' + error);
            });
        }, function (error) {
            reject('Failed to initialise Database: ' + error);
        });
    });
};
exports.getFriendsList = function () {
    return new Promise(function (resolve, reject) {
        initDB
            .then(function (db) {
            SQL_getFriendsTable(db)
                .then(function (rows) {
                var friendsList = [];
                for (var row in rows) {
                    friendsList.push({
                        nickname: rows[row][1]
                    });
                }
                resolve(friendsList);
            }, function (error) {
                reject('Failed to get Friends List: ' + error);
            });
        }, function (error) {
            reject('Failed to initialise Database: ' + error);
        });
    });
};
// 2. More complex operations that do require parameters
exports.addFriend = function (nickname) {
    return new Promise(function (resolve, reject) {
        initDB
            .then(function (db) {
            SQL_addFriendToDB(db, nickname)
                .then(function () {
                resolve('Friend added successfully!');
            }, function (error) {
                reject('Failed to add Friend: ' + error);
            });
        }, function (error) {
            reject('Failed to initialise Database: ' + error);
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0b3JlLXNxbGl0ZS12ZXJzaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0b3JlLXNxbGl0ZS12ZXJzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFFQSx1QkFBdUI7QUFDdkIsT0FBTztBQUNQLEdBQUc7QUFDSCw2SUFBNkk7QUFDN0ksMkhBQTJIO0FBQzNILGtJQUFrSTtBQUNsSSxHQUFHO0FBQ0gsdUJBQXVCO0FBR3ZCLCtCQUErQjtBQUMvQixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUM1QyxJQUFNLFVBQVUsR0FBRztJQUNmLE9BQU8sRUFBRSxTQUFTO0NBQ3JCLENBQUE7QUFHRCxvSUFBb0k7QUFDcEksSUFBSSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRTVDLDJCQUEyQixFQUFPLEVBQUUsUUFBZ0I7SUFDaEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsMkNBQTJDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQy9FLENBQUM7QUFFRCw2QkFBNkIsRUFBTztJQUNoQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFFRCw4QkFBOEIsRUFBTztJQUNqQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQywwRkFBMEYsQ0FBQyxDQUFDO0FBQ2xILENBQUM7QUFDRCx1QkFBdUI7QUFFdkIsOEJBQThCO0FBQzlCLHFHQUFxRztBQUNyRyw4QkFBOEI7QUFFOUIsMERBQTBEO0FBRS9DLFFBQUEsZUFBZSxHQUFHO0lBQ3pCLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLE1BQU07YUFDRCxJQUFJLENBQUMsVUFBQSxFQUFFO1lBQ0osb0JBQW9CLENBQUMsRUFBRSxDQUFDO2lCQUNuQixJQUFJLENBQUM7Z0JBQ0YsT0FBTyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDakQsQ0FBQyxFQUFFLFVBQUEsS0FBSztnQkFDSixNQUFNLENBQUMsMENBQTBDLEdBQUcsS0FBSyxDQUFDLENBQUM7WUFDL0QsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDLEVBQUUsVUFBQSxLQUFLO1lBQ0osTUFBTSxDQUFDLGlDQUFpQyxHQUFHLEtBQUssQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUFFVSxRQUFBLGNBQWMsR0FBRztJQUN4QixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUMvQixNQUFNO2FBQ0QsSUFBSSxDQUFDLFVBQUEsRUFBRTtZQUNKLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztpQkFDbEIsSUFBSSxDQUFDLFVBQUEsSUFBSTtnQkFDTixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7Z0JBQ3JCLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ25CLFdBQVcsQ0FBQyxJQUFJLENBQUM7d0JBQ2IsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ3pCLENBQUMsQ0FBQztnQkFDUCxDQUFDO2dCQUNELE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN6QixDQUFDLEVBQUUsVUFBQSxLQUFLO2dCQUNKLE1BQU0sQ0FBQyw4QkFBOEIsR0FBRyxLQUFLLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsRUFBRSxVQUFBLEtBQUs7WUFDSixNQUFNLENBQUMsaUNBQWlDLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQTtBQUVELHdEQUF3RDtBQUU3QyxRQUFBLFNBQVMsR0FBRyxVQUFVLFFBQWdCO0lBQzdDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLE1BQU07YUFDRCxJQUFJLENBQUMsVUFBQSxFQUFFO1lBQ0osaUJBQWlCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQztpQkFDMUIsSUFBSSxDQUFDO2dCQUNGLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1lBQzFDLENBQUMsRUFBRSxVQUFBLEtBQUs7Z0JBQ0osTUFBTSxDQUFDLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxFQUFFLFVBQUEsS0FBSztZQUNKLE1BQU0sQ0FBQyxpQ0FBaUMsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRnJpZW5kIH0gZnJvbSAnLi9hcHAtZGF0YS1tb2RlbCc7XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBBUEk6XG4vLyBcbi8vIGluaXRGcmllbmRzRGF0YS50aGVuKDxkbyBzdHVmZj4pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBpbml0YWxpc2VzIHRoZSBEYXRhYmFzZSBhbmQgdGhlIEZyaWVuZHMgRGF0YSBUYWJsZVxuLy8gZ2V0RnJpZW5kc0xpc3QudGhlbiggZnJpZW5kc0xpc3QgPT4geyA8ZG8gc3R1ZmYgd2l0aCBmcmllbmRzTGlzdCBBcnJheT4gfSApICAgICAgICAgIC0tIGdldHMgdGhlIGZyaWVuZHNMaXN0IGFzIGFuIEFycmF5XG4vLyBhZGRGcmllbmQoPGZyaWVuZCBuaWNrbmFtZT4pLnRoZW4oIGxvZ01lc3NhZ2UgPT4gezxvcHRpb25hbD59KSAgICAgICAgICAgICAgICAgICAgICAgLS0gYWRkcyBhIEZyaWVuZCB0byB0aGUgRnJpZW5kcyBEYXRhIFRhYmxlXG4vLyBcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLy8gU1FMaXRlIGluaXRpYWwgY29uZmlndXJhdGlvblxudmFyIFNxbGl0ZSA9IHJlcXVpcmUoJ25hdGl2ZXNjcmlwdC1zcWxpdGUnKTtcbmNvbnN0IFNRTF9jb25maWcgPSB7XG4gICAgZGJfbmFtZTogJ3Rlc3QuZGInLFxufVxuXG5cbi8vIFNRTF8gcHJlZml4IGFsaWFzZXMgOiB0aGlzIGlzIHRoZSBvbmx5IHBsYWNlIGluIHRoZSBhcHBsaWNhdGlvbiB3aGVyZSBvbmUgd291bGQgaGF2ZSB0byBkZWZpbmUvaW50ZXJhY3QgZGlyZWN0bHkgd2l0aCBTUUwgcXVlcmllc1xudmFyIGluaXREQiA9IG5ldyBTcWxpdGUoU1FMX2NvbmZpZy5kYl9uYW1lKTtcblxuZnVuY3Rpb24gU1FMX2FkZEZyaWVuZFRvREIoZGI6IGFueSwgbmlja25hbWU6IHN0cmluZykge1xuICAgIHJldHVybiBkYi5leGVjU1FMKCdJTlNFUlQgSU5UTyBmcmllbmRzIChuaWNrbmFtZSkgVkFMVUVTICg/KScsIFtuaWNrbmFtZV0pO1xufVxuXG5mdW5jdGlvbiBTUUxfZ2V0RnJpZW5kc1RhYmxlKGRiOiBhbnkpIHtcbiAgICByZXR1cm4gZGIuYWxsKCdTRUxFQ1QgKiBGUk9NIGZyaWVuZHMnKTtcbn1cblxuZnVuY3Rpb24gU1FMX2luaXRGcmllbmRzVGFibGUoZGI6IGFueSkge1xuICAgIHJldHVybiBkYi5leGVjU1FMKCdDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUUyBmcmllbmRzIChpZCBJTlRFR0VSIFBSSU1BUlkgS0VZIEFVVE9JTkNSRU1FTlQsIG5pY2tuYW1lIFRFWFQpJyk7XG59XG4vLyBFTkQgT0YgU1FMXyBwcmVmaXhlc1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGV4cG9zZWQgdG8gYWxsIG90aGVyIFZpZXdzLCB3aGljaCBhYnN0cmFjdCBhd2F5IGNvbXBsZXRlbHkgZnJvbSB0aGUgREIgYmFja2VuZC4gXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gMS4gU2ltcGxlIGluc3RydWN0aW9ucyB3aGljaCBkbyBub3QgcmVxdWlyZSBwYXJhbWVudGVyc1xuXG5leHBvcnQgdmFyIGluaXRGcmllbmRzRGF0YSA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgbG9nTWVzc2FnZTogc3RyaW5nIH0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpbml0REJcbiAgICAgICAgICAgIC50aGVuKGRiID0+IHtcbiAgICAgICAgICAgICAgICBTUUxfaW5pdEZyaWVuZHNUYWJsZShkYilcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgnRnJpZW5kcyBUYWJsZSBhZGRlZCBzdWNjZXNzZnVsbHkhJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgnRmFpbGVkIHRvIGluaXRpYWxpc2UgdGhlIEZyaWVuZHMgVGFibGU6ICcgKyBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdCgnRmFpbGVkIHRvIGluaXRpYWxpc2UgRGF0YWJhc2U6ICcgKyBlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHZhciBnZXRGcmllbmRzTGlzdCA9IGZ1bmN0aW9uICgpOiBQcm9taXNlPHsgZnJpZW5kc0xpc3Q6IEFycmF5PE9iamVjdD4gfT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGluaXREQlxuICAgICAgICAgICAgLnRoZW4oZGIgPT4ge1xuICAgICAgICAgICAgICAgIFNRTF9nZXRGcmllbmRzVGFibGUoZGIpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHJvd3MgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZyaWVuZHNMaXN0ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciByb3cgaW4gcm93cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyaWVuZHNMaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZTogcm93c1tyb3ddWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZyaWVuZHNMaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdGYWlsZWQgdG8gZ2V0IEZyaWVuZHMgTGlzdDogJyArIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCdGYWlsZWQgdG8gaW5pdGlhbGlzZSBEYXRhYmFzZTogJyArIGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vLyAyLiBNb3JlIGNvbXBsZXggb3BlcmF0aW9ucyB0aGF0IGRvIHJlcXVpcmUgcGFyYW1ldGVyc1xuXG5leHBvcnQgdmFyIGFkZEZyaWVuZCA9IGZ1bmN0aW9uIChuaWNrbmFtZTogc3RyaW5nKTogUHJvbWlzZTx7IGxvZ01lc3NhZ2U6IHN0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaW5pdERCXG4gICAgICAgICAgICAudGhlbihkYiA9PiB7XG4gICAgICAgICAgICAgICAgU1FMX2FkZEZyaWVuZFRvREIoZGIsIG5pY2tuYW1lKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCdGcmllbmQgYWRkZWQgc3VjY2Vzc2Z1bGx5IScpO1xuICAgICAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoJ0ZhaWxlZCB0byBhZGQgRnJpZW5kOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoJ0ZhaWxlZCB0byBpbml0aWFsaXNlIERhdGFiYXNlOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSk7XG59Il19