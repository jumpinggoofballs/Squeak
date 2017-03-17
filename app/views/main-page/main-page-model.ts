import { Observable } from 'data/observable';

export class MainPageModel extends Observable {

    // Add private variables here    
    // private counter: number;

    constructor() {
        super();

        // set observables here        
        this.set('message', 'this be the data model');
        this.set('myFriends', [
            {
                nickname: 'First Friend'
            },
            {
                nickname: 'Second Friend'
            },
        ]);
    }

    // define Actions here    
    // public tapAction() {
    //     this.counter--;
    //     if (this.counter <= 0) {
    //         this.set('message', 'Hoorraaay! You unlocked the NativeScript clicker achievement!');
    //     }
    //     else {
    //         this.set('message', this.counter + ' taps left');
    //     }
    // }
};
