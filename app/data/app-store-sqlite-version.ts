import { Friend } from './app-data-model';

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
const SQL_config = {
    db_name: 'test.db',
}


// SQL_ prefix aliases : this is the only place in the application where one would have to define/interact directly with SQL queries
var initDB = new Sqlite(SQL_config.db_name);

function SQL_addFriendToDB(db: any, nickname: string) {
    return db.execSQL('INSERT INTO friends (nickname) VALUES (?)', [nickname]);
}

function SQL_getFriendsTable(db: any) {
    return db.all('SELECT * FROM friends');
}

function SQL_initFriendsTable(db: any) {
    return db.execSQL('CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT)');
}
// END OF SQL_ prefixes

//////////////////////////////
// Utility functions exposed to all other Views, which abstract away completely from the DB backend. 
//////////////////////////////

// 1. Simple instructions which do not require paramenters

export var initFriendsData = function (): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {
        initDB
            .then(db => {
                SQL_initFriendsTable(db)
                    .then(() => {
                        resolve('Friends Table added successfully!');
                    }, error => {
                        reject('Failed to initialise the Friends Table: ' + error);
                    });
            }, error => {
                reject('Failed to initialise Database: ' + error);
            });
    });
}

export var getFriendsList = function (): Promise<{ friendsList: Array<Object> }> {
    return new Promise((resolve, reject) => {
        initDB
            .then(db => {
                SQL_getFriendsTable(db)
                    .then(rows => {
                        let friendsList = [];
                        for (var row in rows) {
                            friendsList.push({
                                nickname: rows[row][1]
                            });
                        }
                        resolve(friendsList);
                    }, error => {
                        reject('Failed to get Friends List: ' + error);
                    });
            }, error => {
                reject('Failed to initialise Database: ' + error);
            });
    });
}

// 2. More complex operations that do require parameters

export var addFriend = function (nickname: string): Promise<{ logMessage: string }> {
    return new Promise((resolve, reject) => {
        initDB
            .then(db => {
                SQL_addFriendToDB(db, nickname)
                    .then(() => {
                        resolve('Friend added successfully!');
                    }, error => {
                        reject('Failed to add Friend: ' + error);
                    });
            }, error => {
                reject('Failed to initialise Database: ' + error);
            });
    });
}