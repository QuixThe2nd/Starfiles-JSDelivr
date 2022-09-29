function downloadFile(url, name){
    document.getElementById('download_status').style.display = 'block';
    document.getElementById('downloadcountdownmessage').style.display = 'block';
    document.getElementById('download_progress_bar').style.display = 'block';
    var seconds = 5;
    var intervalVar = setInterval(countdownB, 1000);
    function countdownB(){
        if(seconds >= 0){
            document.getElementById('download_progress').style.width = (5-seconds)*20 + "%";
            if(seconds == 1)
                document.getElementById('download_status').innerHTML = 'Your download begins in ' + seconds + ' second';
            else
                document.getElementById('download_status').innerHTML = 'Your download begins in ' + seconds + ' seconds';
        }else if(seconds <= 0){
            document.getElementById('download_status').innerHTML = "Download Started";
            var a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', name);
            a.click();
            clearInterval(intervalVar);
        }
        seconds--;
    } 
}
/*window.download_started = {}; 
function downloadFile(){
    var download_buttons = document.getElementsByClassName("download_button");
    for(var i = 0; i < download_buttons.length; i++){
        download_buttons[i].innerHTML = download_buttons[i].innerHTML;
        download_buttons[i].addEventListener('click', function(){
            console.log('Download Button Clicked');
            var downloadButton = this;
            var url = downloadButton.getAttribute('data-directurl');
            if(typeof window.download_started[url] !== 'undefined'){
                if(window.download_started[url])
                    return true;
            }
            window.download_started[url] = true;
            var filename = downloadButton.getAttribute('data-filename');
            document.getElementById('download_status').style.display = 'block';
            document.getElementById('downloadcountdownmessage').style.display = 'block';
            document.getElementById('download_progress_bar').style.display = 'block';
            var timerId = setInterval(countdown, 1000);
            function countdown(){
                if(timeLeft == -1){
                    clearTimeout(timerId);
                    var request = new XMLHttpRequest();
                    request.responseType = "blob"; // Not sure if this is needed
                    request.open("POST", url);
                    var self = downloadButton;
                    console.log('Download Started');
                    document.getElementById('download_status').innerHTML = "Download Started";
                    request.onreadystatechange = function () {
                        if(request.readyState === 4){
                            console.log('Download Complete');
                            document.getElementById('download_status').innerHTML = "Download Completed. File not showing?&nbsp;<a href='" + url + "'>Download</a>";
                            var anchor = document.createElement('a');
                            anchor.download = filename;
                            anchor.href = window.URL.createObjectURL(request.response);
                            anchor.click();
                            console.log('Redirecting');
                            gtag('event', 'file_download', {
                                "url" : url,
                                "filename" : filename
                            });
                            window.download_started[url] = false;
                            window.location.replace(window.location.href + '?#download');
                        }
                    };
                    request.addEventListener("progress", function (e) {
                        if(e.lengthComputable) {
                            var completedPercentage = Math.floor(e.loaded / e.total * 100);
                            console.log('Download ' + completedPercentage + '% Complete');
                            document.getElementById("download_status").innerHTML = completedPercentage + "% Downloaded";
                            document.getElementById('download_progress').style.width = completedPercentage + "%";
                            document.getElementById('download_status').style = "";
                        }
                    }, false);
                    request.onerror = () => {
                        console.log('Download Failed');
                        document.getElementById("download_status").innerHTML = "Download Complete. File not showing?&nbsp;<a href='" + url + "'>Download</a>";
                    };
                    request.onabort = () => {
                        console.log('Download Cancelled');
                        document.getElementById("download_status").innerHTML = "Download Cancelled.";
                    };
                    request.send();
                }else{
                    console.log('Download Begins in ', timeLeft);
                    document.getElementById('download_status').innerHTML = 'Your download begins in ' + timeLeft + ' seconds';
                    timeLeft--;
                }
            }
        });
    }
}
downloadFile();
*/
