import { Friend } from './app-data-model';


// SQLite initial configuration
var Sqlite = require('nativescript-sqlite');
const SQL_config = {
    db_name: 'test.db',
}


// SQL_ prefix aliases : this is the only place in the application where one would have to interact directly with SQL queries
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


// Utility functions exposed to all other Views, which abstract away completely from the DB backend. 
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