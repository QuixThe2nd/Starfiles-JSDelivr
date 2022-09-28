window.addEventListener('load', (event) => {
    // var time = 1;
    var interval = setInterval(function(){ 
        if(document.querySelector('.flat.adaptive.horizontal').childElementCount == 0){
            if(!document.getElementById("adblock_detected")){
                let el = document.createElement('p');
                el.classList.add('warning');
                el.id = 'adblock_detected';
                document.querySelector('.adblock_check').appendChild(el);
            }
            document.getElementById("adblock_detected").innerHTML = "Starfiles runs on ads. Our ads are non intrusive, that's a promise.<br>Whitelist Starfiles on your adblocker to get&nbsp;<b class=\'warning\'>2x faster download speeds</b> or <a href=\"https://patreon.com/starfiles\">get Starfiles premium to hide all ads</a>.";
            setCookie("adblock_found", "true", 30);
        }else{
            document.getElementById("adblock_detected").innerHTML = '';
            setCookie("adblock_found", "false", 30);
            clearInterval(interval);
        }
        // let gAd = document.querySelector("ins.adsbygoogle");
        // if(gAd && gAd.innerHTML.replace(/\s/g, "").length == 0){
        //     document.getElementById("adblock_detected").innerHTML = "Starfiles runs on ads. Our ads are non intrusive, that's a promise.<br>Whitelist Starfiles on your adblocker to get&nbsp;<b class=\'warning\'>2x faster download speeds</b> or <a href=\"https://patreon.com/starfiles\">get Starfiles premium to hide all ads</a>.";
        //     setCookie("adblock_found", "true", 30);
        // }else{
        //     document.getElementById("adblock_detected").innerHTML = '';
        //     setCookie("adblock_found", "false", 30);
        //     clearInterval(interval);
        // }
        // // if(time <= 40){
        // //     if(document.querySelector(".adblock_check").clientHeight > 0){
        // //         // Adblock Not Detected
        // //         setCookie("adblock_found", "false", 30);
        // //         clearInterval(interval);
        // //     }
        // // }else
        // //     adblockDetected();
        // time++;
    }, 100);
});
// async function checkElement(selector) {
//     while (document.querySelector(selector) === null) {
//         await new Promise(resolve => requestAnimationFrame(resolve));
//     }
//     return document.querySelector(selector);
// }
// checkElement(".ea-pixel").then((selector) => {
//     document.getElementsByClassName("ea-pixel")[0].width = "0px";
//     document.getElementsByClassName("ea-pixel")[0].height = "0px";
// });