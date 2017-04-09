import * as bluetooth from 'nativescript-bluetooth';

export function init(): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
        bluetooth.isBluetoothEnabled()
            .then(enabled => {
                resolve("Enabled? " + enabled);
            });
    });
}