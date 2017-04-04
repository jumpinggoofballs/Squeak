const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.pushNotify = functions.database.ref('/notifications/{notificationId}').onWrite(event => {

    const snapshot = event.data;
    const notificationId = event.params.notificationId;

    // abort if the data has not been mutated (== the .previous.value of the snapshot is null )
    if (snapshot.previous.val()) {
        return;
    }

    // else: get the target user firebase UID 
    const targetUser = snapshot.val().targetUser;
    const messageRef = snapshot.val().messageRef;

    const payload = {
        data: {
            targetUser: targetUser,
            messageToFetchRef: messageRef,
            notificationId: notificationId
        }
    }

    // grab the FCM messaging token from the target user record in firebase    
    const targetTokenRef = event.data.adminRef.root.child('users').child(targetUser).child('t');
    targetTokenRef.once('value').then(tokenObj => {

        // send the pre-defined payload to the device identified by the FCM token
        const token = tokenObj.val();
        return admin.messaging().sendToDevice(token, payload).then(() => {

            // remove the notification record
            admin.database().ref('/notifications').child(notificationId).remove();
        });
    });
});