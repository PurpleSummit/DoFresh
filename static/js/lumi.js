let lumiTimeout;

document.addEventListener("DOMContentLoaded", () => {
    const lumi = document.createElement("div");
    lumi.id = "lumi";
    lumi.innerHTML = `<object type="image/svg+xml" data="">
        <img src="" alt="Lumi character">
    </object>`;

    if (localStorage.length >= 2) {
        lumi.style.left = '515px';
        const todoBox = document.body.querySelector('.todo-box-div');

        if (todoBox) {
            todoBox.prepend(lumi);
        }
    } else {
        document.body.prepend(lumi);
    }

    lumiMainBlink();
});

function setLumiCostume(svgPath) {
    const lumi = document.querySelector('#lumi');
    const objectTag = lumi.querySelector('object');

    let previousSvgPath = objectTag.querySelector('img').src;

    if (previousSvgPath && previousSvgPath.includes(svgPath.replace('.', ''))) {
        lumi.classList.add('lumi-swapping');
    }

    setTimeout(() => {
        if (objectTag) {
            objectTag.setAttribute('data', svgPath);
            objectTag.querySelector('img').src = svgPath;
        }
        lumi.classList.remove('lumi-swapping');
    }, 150);
}

export function lumiMainBlink() {
    setLumiCostume('../static/img/lumi_blink_passive.svg');
}

export function lumiStaticImg() {
    setLumiCostume('../static/img/lumi_main.svg');

    // lumi.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="eP52vAqxCXV1" viewBox="0 0 1080 1080" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" project-id="b77b5d3ad3b443c1be5daa144533c30f" export-id="7c06ed8fd5514535b60b304061e83db1" cached="false" style="background-color:rgba(255,255,255,0)"><g transform="matrix(2.278063 0 0 2.235601 -659.385292 -1341.375997)"><ellipse rx="114.235681" ry="22.958746" transform="matrix(0.870554 0 0 0.58811 526.197677 1066.497732)" fill="rgba(130,120,144,0.57)" fill-opacity="0.39" stroke-width="0"/><g transform="translate(-66.628249 560.198274)"><path d="M55.73,26.77l4.63,9.38c.929428,1.887329,2.728272,3.19626,4.81,3.5l10.35,1.5c2.385572.363936,5.377412,2.005536,6.125919,4.29969s-.874006,4.849499-2.585919,6.55031l-7.49,7.3c-1.520972,1.47709-2.210266,3.612405-1.84,5.7L71.5,75.31c.389704,2.389243.193008,4.78512-1.77,6.201789s-5.355234,1.610857-7.5.488211L53,77.18c-1.862346-.979711-4.087654-.979711-5.95,0L37.77,82c-2.153461,1.131654-5.532404,1.636859-7.5.206266s-2.182487-4.548791-1.77-6.946266L30.27,65c.356342-2.074567-.331865-4.191553-1.84-5.66L20.94,52c-1.742057-1.697538-3.36954-4.236892-2.618209-6.55031s3.751162-3.999659,6.158209-4.34969l10.35-1.5c2.081728-.30374,3.880572-1.612671,4.81-3.5l4.63-9.38c1.085997-2.176319,3.281647-5.398385,5.713855-5.387773s4.67918,3.252061,5.746145,5.437773Z" transform="matrix(3.641953 0 0 3.641956 410.7884 203.663421)" fill="#ffe97f" stroke="#2d264b" stroke-width="0"/><path d="M83.050528,46.861698C80.827561,51.287053,71.57,59.3,71.57,59.3c-1.520972,1.47709-2.210266,3.612405-1.84,5.7L71.5,75.31c.389704,2.389243.193008,4.78512-1.77,6.201789s-5.355234,1.610857-7.5.488211L53,77.18c-1.862346-.979711-4.087654-.979711-5.95,0L37.77,82c-2.153461,1.131654-5.532404,1.636859-7.5.206266s-2.182487-4.548791-1.77-6.946266L30.27,65c.356342-2.074567-.331865-4.191553-1.84-5.66c0,0-9.655487-8.210618-10.347483-11.918984" transform="matrix(3.525796 0 0 3.577443 416.593686 207.07992)" fill="#f9bb59" stroke="#2d264b" stroke-width="0"/><path d="M54.735299,25.34748l4.711396,10.359872c1.266208,2.068057,2.247904,2.923851,4.717009,3.487866l11.545533,1.582999c2.328299.355198,5.547143,1.748761,6.277679,3.987836s-.926623,4.228666-2.597436,5.888643l-8.546403,8.045051c-1.107966,1.568643-1.805591,3.443-1.795825,5.563153l1.847566,10.860324c.380348,2.331882.523527,5.167872-1.392353,6.550529s-5.561818,1.07455-7.655092-.021143l-9.689078-5.203992c-1.817635-.95619-4.550275-.790314-6.367909.165876l-9.154722,4.806069c-2.10176,1.104485-5.596486,2.629196-7.516843,1.232949s-2.218113-3.858969-1.686089-6.785315l2.036229-11.535439c.347787-2.024761-.732937-4.793378-2.204865-6.226571l-7.717032-7.253631c-1.700233-1.656783-3.943738-3.755022-3.210445-6.012899s4.264012-3.764169,6.61327-4.105796l10.924688-1.459018c2.03175-.296448,4.370341-2.331087,5.277455-4.173104l4.716359-9.674978c1.059925-2.12407,2.884902-5.396861,5.258717-5.386504s4.566842,3.173986,5.608191,5.307223Z" transform="matrix(3.065069 0 0 3.096467 441.982732 234.803933)" fill="#fdd46b" stroke="#000" stroke-width="0"/><path d="M55.73,26.77l4.63,9.38c.929428,1.887329,2.728272,3.19626,4.81,3.5l10.35,1.5c2.385572.363936,5.377412,2.005536,6.125919,4.29969s-.874006,4.849499-2.585919,6.55031l-7.49,7.3c-1.520972,1.47709-2.210266,3.612405-1.84,5.7L71.5,75.31c.389704,2.389243.193008,4.78512-1.77,6.201789s-5.355234,1.610857-7.5.488211L53,77.18c-1.862346-.979711-4.087654-.979711-5.95,0L37.77,82c-2.153461,1.131654-5.532404,1.636859-7.5.206266s-2.182487-4.548791-1.77-6.946266L30.27,65c.356342-2.074567-.331865-4.191553-1.84-5.66L20.94,52c-1.742057-1.697538-3.36954-4.236892-2.618209-6.55031s3.751162-3.999659,6.158209-4.34969l10.35-1.5c2.081728-.30374,3.880572-1.612671,4.81-3.5l4.63-9.38c1.085997-2.176319,3.281647-5.398385,5.713855-5.387773s4.67918,3.252061,5.746145,5.437773Z" transform="matrix(3.641953 0 0 3.641956 410.788401 203.663421)" fill="rgba(255,255,255,0)" stroke="#2d264b" stroke-width="2"/></g><g transform="translate(-66.628249 560.198275)"><circle r="27.5" transform="matrix(0.405895 0 0 0.176913 634.015253 409.46332)" fill="#ffb6c1" fill-opacity="0.99"/><circle r="27.5" transform="matrix(0.405895 0 0 0.176913 551.594972 409.46332)" fill="#ffb6c1" fill-opacity="0.99"/></g><g transform="translate(-66.628249 560.198274)"><circle r="27.5" transform="matrix(0.304325 0 0 0.469417 571.126022 395.609397)"/><circle r="27.5" transform="matrix(0.304325 0 0 0.469417 614.484203 395.609395)"/></g><path d="M680.951668,931.339593c13.065747,13.044066,22.356545,7.870368,30.25524,0" transform="matrix(1 0 0 0.889946 -169.881612 151.927434)" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
}

export function lumiJump() {
    clearTimeout(lumiTimeout);

    setLumiCostume('../static/img/lumi_jumping.svg');

    setTimeout(() => {
        lumiMainBlink();
    }, 5600);
}