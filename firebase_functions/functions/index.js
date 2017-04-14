const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.friendNotify = functions.database.ref('/notifications/{notificationId}').onWrite(event => {

    const snapshot = event.data;
    const notificationId = event.params.notificationId;

    // abort if the data has not been mutated (== the .previous.value of the snapshot is null )
    if (snapshot.previous.val()) {
        return;
    }

    // also abort if the data has just been cleaned up by the client
    if (!snapshot.val()) {
        return;
    }

    // else: get the notification details
    const targetUser = snapshot.val().targetUser;
    const myDetails = snapshot.val().myDetails;

    // options for sending
    const options = {
        priority: "high"
    };

    // construct the payload
    const payload = {
        data: {
            targetUser: targetUser,
            myDetails: myDetails,
        }
    };


    // grab the FCM messaging token from the target user record in firebase    
    const targetTokenRef = event.data.adminRef.root.child('users').child(targetUser).child('t');
    targetTokenRef.once('value').then(tokenObj => {

        // send the pre-defined payload to the device identified by the FCM token
        const token = tokenObj.val();
        return admin.messaging().sendToDevice(token, payload, options).then(() => {

            // remove the notification record
            admin.database().ref('/notifications').child(notificationId).remove();
        });
    });
});

exports.messageNotify = functions.database.ref('/users/{targetUID}/z/{messageId}').onWrite(event => {

    const snapshot = event.data;
    const targetUID = event.params.targetUID;
    const messageId = event.params.messageId;

    // abort if the data has not been mutated (== the .previous.value of the snapshot is null )
    if (snapshot.previous.val()) {
        return;
    }

    // also abort if the data has just been cleaned up by the client
    if (!snapshot.val()) {
        return;
    }

    // construct the payload
    var payload = {
        notification: {
            title: 'Squeak',
            body: 'You have a new message!',
            sound: 'default',
        },
        data: {
            targetUser: targetUID,
            messageToFetch: messageId
        }
    };

    // grab the FCM messaging token from the target user record in firebase 
    const targetTokenRef = event.data.adminRef.root.child('users').child(targetUID).child('t');
    targetTokenRef.once('value').then(tokenObj => {

        // send the pre-defined payload to the device identified by the FCM token
        const token = tokenObj.val();
        return admin.messaging().sendToDevice(token, payload);
    });
});

exports.receiptNotify = functions.database.ref('confirmations/{targetUID}/{notificationRef}').onWrite(event => {
    const snapshot = event.data;
    const targetUID = event.params.targetUID;
    const notificationRef = event.params.notificationRef;

    // abort if the data has not been mutated (== the .previous.value of the snapshot is null )
    if (snapshot.previous.val()) {
        return;
    }

    // also abort if the data has just been cleaned up
    if (!snapshot.val()) {
        return;
    }

    // options for sending
    const options = {
        priority: "high"
    };

    // construct the payload
    var payload = {
        data: {
            m: snapshot.val()
        }
    };

    // grab the FCM messaging token from the target user record in firebase    
    const targetTokenRef = event.data.adminRef.root.child('users').child(targetUID).child('t');
    targetTokenRef.once('value').then(tokenObj => {

        // send the pre-defined payload to the device identified by the FCM token
        const token = tokenObj.val();
        return admin.messaging().sendToDevice(token, payload, options).then(() => {

            // remove the notification record
            admin.database().ref('/confirmations').child(targetUID).child(notificationRef).remove();
        });
    });
});