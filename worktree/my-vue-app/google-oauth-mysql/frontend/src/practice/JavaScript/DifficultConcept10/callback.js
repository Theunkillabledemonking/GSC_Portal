function fetchData1(callback) {
    setTimeout(() => {
        const data = '이름';
        callback(data);
    }, 0)
}

function fetchData2(callback) {
    setTimeout(() => {
        const data = '나이';
        callback(data);
    }, 0)
}

function fetchData3(callback) {
    setTimeout(() => {
        const data = '성별';
        callback(data);
    }, 0)
}

function fetchData4(callback) {
    setTimeout(() => {
        const data = '지역';
        callback(data);
    }, 0)
}

fetchData1((data1) => {
    console.log(data1);
    fetchData2((data2 => {
        console.log(data2);
        fetchData3((data3 => {
            console.log(data3);
            fetchData4((data4 => {
                console.log(data4);
            }))
        }))
    }))
})