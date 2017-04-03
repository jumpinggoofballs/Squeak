const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.pushNotify = functions.database.ref('/notifications/{notificationId}').onWrite(event => {

    const snapshot = event.data;

    // abort if the data has not been mutated (== the .previous.value of the snapshot is null )
    if (snapshot.previous.val()) {
        return;
    }

    // else: get the target user firebase UID 
    const targetUser = snapshot.val();
    const payload = {
        notification: {
            title: 'Squeak',
            body: 'New secure message received!'
        }
    }

    // grab the FCM messaging token from the target user record in firebase    
    const targetTokenRef = event.data.adminRef.root.child('users').child(targetUser).child('t');
    targetTokenRef.once('value').then(tokenObj => {

        // send the pre-defined payload to the device identified by the FCM token
        const token = tokenObj.val();
        return admin.messaging().sendToDevice(token, payload);
    });
});