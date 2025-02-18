function showContext() {
    console.log(this);
}

const myObj = { custom: 'context' };

const boundShowContext = showContext.bind(myObj);
boundShowContext();

const preson = {
    name: 'Bob',
    showNameAfterDelay() {
        setTimeout(() => {
            console.log(this.name);
        }, 1000);
    }
};
preson.showNameAfterDelay();