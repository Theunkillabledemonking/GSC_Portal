function execute() {
    const promises = [
        new Promise(( resolve, reject) => { console.log(' Success Promise1'); resolve('success')}),
        new Promise(( resolve, reject) => { console.log(' Success Promise2'); resolve('success')}),
        new Promise(( resolve, reject) => { console.log(' Success Promise3'); resolve('success')}),
    ]
    return Promise.all( promises);
};

async function main() {
    try {
        await execute();
    } catch (error) {
        console.log('error: ', error);
    }
}

main()