let totalUploads = [];
const BYTES_PER_CHUNK = parseInt(1048576 * 2, 10); // 2MB
let isUploading = false;
let completehandler = false;
let currentUploadCounter = 0;
let startTime;
let graceTime = 0;
let idleTime;
let previousOutput;
let noMbpsTask;
let isProcessingUploads = false;
let online = true;
let checkingConnection = false;
let noInternet;
let concurrentUploads = 5;
// let logging_enabled = true;
// let progress = 0;

if (typeof isset === "undefined") {
	function isset(variable, global=false){
	    if(global)
			return typeof window[variable] !== typeof undefined;
	    else
			return typeof this[variable] !== typeof undefined;
	}
}

if (!isset('xenhtml'))∂
    xenhtml = false;
if (typeof starfiles === "undefined")
    starfiles = [];
if (typeof starfiles.local === "undefined")
    starfiles.local = false;
if (typeof starfiles.public === "undefined" || !starfiles.public)
    starfiles.public = 'false';
else
    starfiles.public = 'true';
if(typeof domain === "undefined")
   domain = 'starfiles.co';
if(typeof cdn === "undefined")
   cdn = 'cdn.starfiles.co';
if (typeof starfiles.newtab === "undefined")
    starfiles.newtab = false;
if (!isset('folderid'))
    folderid = '';
if (typeof tier == 'undefined')
    tier = 'free';
if (typeof logging_enabled !== "undefined")
    console.log('Folder: ' + folderid);

const MAX_FILE_SIZE = parseInt(1024 * 1024 * 1024 * ((tier == 'platinum' ? 15 : (tier == 'diamond' ? 10 : (tier == 'gold' ? 5 : (tier == 'silver' ? 2 : 1)))) + (window.location.host == 'signtunes.co' ? 1 : 0)), 10);

const evt = new Event('uploadcomplete');
class UploadTracker {
    constructor(file) {
        this.file = file;
        this.size = file.size;
        this.chunk_index = 0;
		this.total_chunk_count = Math.ceil(this.size / BYTES_PER_CHUNK);
        this.index = totalUploads.length;
        this.allChunksInProgress = false;
        this.finishedUploading = false;
        this.end = BYTES_PER_CHUNK;
        this.start = 0;
        this.fileSizes = [];
        this.c_uploads = [];
        this.c_tries = [];
        this.c_pre_tries = [];
        this.c_pre_uploads = [];
        this.chunk_start_data = [];
        this.chunk_end_data = [];
        this.chunk_upload_queue = [];
        this.chunk_upload_in_progress = [];
        this.chunk_upload_in_finished = [];
		this.chunk_hashes = [];
		let fileUUID = this.uuidv4();
		this.fileId = fileUUID.substring(fileUUID.length - 12, fileUUID.length);

        navigator.sendBeacon('https://api.' + domain + '/file/reserve_id/' + this.fileId);
        if(xenhtml)
            finish('<a href="#" onclick="window.location = \'https://' + domain + '/file/' + this.fileId + '\';setTimeout(function(){window.location.reload()},1500)" target="_blank" class="banner banner-small">' + this.file.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '&nbsp;<i class="fas fa-link"></i></a>&nbsp;<i onclick="open_share_overlay(\'' + this.fileId + '\')" class="fas fa-share-square"></i><br>');
        else if(starfiles.local){
            if(starfiles.newtab)
                finish('<a href="' + starfiles.local_path + this.fileId + '" target="_blank">' + this.file.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '&nbsp;<i class="fas fa-link"></i></a>&nbsp;<i onclick="open_share_overlay(\'' + this.fileId + '\')" class="fas fa-share-square"></i><br>');
            else
                finish('<a href="' + starfiles.local_path + this.fileId + '">' + this.file.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '&nbsp;<i class="fas fa-link"></i></a>&nbsp;<i onclick="open_share_overlay(\'' + this.fileId + '\')" class="fas fa-share-square"></i><br>');
        }else
            finish('<a href="https://' + domain + '/file/' + this.fileId + '" target="_blank" class="banner banner-small">' + this.file.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '&nbsp;<i class="fas fa-link"></i></a>&nbsp;<i onclick="open_share_overlay(\'' + this.fileId + '\')" class="fas fa-share-square"></i><br>');
        document.getElementById('link_not_ready').style.display = 'block';
    }

    async upload() {
        if (this.start < this.size) {
            this.chunk_start_data[this.chunk_index] = this.start;
            this.chunk_end_data[this.chunk_index] = this.end;
            this.chunk_upload_queue.push(this.chunk_index);
            this.chunk_index++;
            this.start = this.end;
            this.end = this.start + BYTES_PER_CHUNK;
        }
        let first = this.getFirstInQueue();
        this.chunk_upload_in_progress.push(first);
        if (typeof logging_enabled !== "undefined")
            console.log("Starting upload " + first);
        await preChunkCheck(first, this);
    }
    hasRemainingChunks() {
        return this.getFirstInQueue() != undefined || this.start < this.size;
    }
    getFirstInQueue() {
        let queue = this.chunk_upload_queue.filter(
            (e) => this.chunk_upload_in_progress.indexOf(e) < 0
        );
        return queue.length > 0 ? queue[0] : undefined;
    }
	uuidv4() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
}

async function uploadFile(isFolder, folder_method = null) {
    async function preStartUploads() {
        document.getElementById("progress").style.display = "block";
        if (!isUploading) {
            isUploading = true;
            completehandler = false;
            startTime = undefined;
            idleTime = undefined;
            graceTime = 0;
            if (typeof logging_enabled !== "undefined")
                console.log("Starting upload");
            await startUploads();
        }
    }
    let progressContainer = document.getElementById("progressContainer");
    let zip = new JSZip();
    let folderName = undefined;
    let files = document.getElementById("uploaded_file").files;
    if(typeof files == 'undefined')
        files = document.querySelector("#uploaded_file input").files;
    for (let file of files) {
        if (file.size < MAX_FILE_SIZE) {
            window.onbeforeunload = confirmExit;

            function confirmExit() {
                return "You have attempted to leave this page. An upload is in progress. Are you sure you want to leave?";
            }
            document.getElementById("preuploadoutput").innerHTML = "Uploading";
            if (isFolder) {
                if (!folderName) folderName = file.webkitRelativePath.split('/')[0];
                let split = file.webkitRelativePath.split("/");
                split.shift();

                zip.file(split.join("/"), file, { binary: true, createFolders: true });
            } else {
                let uploadTracker = new UploadTracker(file);
                if((tier == 'free' && totalUploads.length > 5) || (tier == 'bronze' && totalUploads.length > 10) || (tier == 'silver' && totalUploads.length > 25)){
                    alert('You have too many files uploading at once, please wait for some uploads to complete. Join Starfiles Premium to increase your limit.');
                    return false;
                }
                totalUploads.push(uploadTracker);
                progressContainer.innerHTML += `<div class="progressbar"><div class="progressbarfill" id="progressBar${totalUploads.length}"></div></div>`; // <div class="progressbarfill" id="progressBarBuffer${totalUploads.length}" style="background:#b9b9b9"></div>
                //progressContainer.innerHTML += `<progress id="progressBar${totalUploads.length}" value="0" max="${uploadTracker.size}" style="width: 90%"></progress>`;
            }
        }else
            alert("To upload files larger than " + (window.location.host == 'signtunes.co' ? '2' : '1') + "GB, upload to Starfiles premium.");
    }

    if (isFolder) {
        zip.generateAsync({ type: 'blob' }).then(async file => {
            if (file.size > MAX_FILE_SIZE) {
                alert("To upload files larger than " + (window.location.host == 'signtunes.co' ? '2' : '1') + ", upload to Starfiles premium.");
                return;
            }

            file.name = folderName + ".zip";
            let uploadTracker = new UploadTracker(file);
            totalUploads.push(uploadTracker);
            progressContainer.innerHTML += `<div class="progressbar"><div class="progressbarfill" id="progressBar${totalUploads.length}"></div></div>`; // <div class="progressbarfill" id="progressBarBuffer${totalUploads.length}" style="background:#b9b9b9"></div>
            //progressContainer.innerHTML += `<progress id="progressBar${totalUploads.length}" value="0" max="${uploadTracker.size}" style="width: 90%"></progress>`;
            await preStartUploads();
        })
    } else {
        await preStartUploads();
    }
}

function getSHA256(blob, cbProgress) {
    return new Promise((resolve, reject) => {
        let sha256 = CryptoJS.algo.SHA256.create();
        endCallback = (err) => {
            if (err)
                reject(err);
            else
                resolve(sha256.finalize().toString(CryptoJS.enc.Hex));
        };
        let fileSize = blob.size;
        const chunkSize = 4 * 1024 * 1024; // 4MB
        let offset = 0;
        let reader = new FileReader();

        function readNext() {
            reader.readAsBinaryString(blob.slice(offset, offset + chunkSize));
        }
        reader.onload = function() {
            if (reader.error) {
                endCallback(reader.error || {});
                return;
            }
            offset += reader.result.length;
            // callback for handling read chunk
            sha256.update(CryptoJS.enc.Latin1.parse(reader.result));
            if (cbProgress)
                cbProgress(offset / fileSize);

            if (offset >= fileSize) {
                endCallback(null);
                return;
            }
            readNext();
        };
        reader.onerror = function(err) {
            endCallback(err || {});
        };
        readNext();
    });
}

async function startUploads() {
    if (!online || checkingConnection || isProcessingUploads) return;
    isProcessingUploads = true;
    // 2 - 1 = 1 - true
    // 2 - 15 = 13 - false
    let i = currentUploadCounter;
    let failed = 0;
    let localTracker = totalUploads.filter((tracker) => !tracker.finishedUploading);
    if (typeof logging_enabled !== "undefined")
        console.log(localTracker.length);
    if (i >= concurrentUploads && typeof logging_enabled !== "undefined")
        console.log("Preventing start of new upload. I:" + i + " Concurrent:" + concurrentUploads + " Counter:" + currentUploadCounter);
    else if (typeof logging_enabled !== "undefined")
        console.log("Attempting upload. I:" + i + " Concurrent:" + concurrentUploads + " Counter:" + currentUploadCounter);
    while (i < concurrentUploads && failed < totalUploads.length && localTracker.length != 0) {
        let tracker = shuffle(localTracker)[i % totalUploads.length];
        if (tracker) {
            if (tracker.hasRemainingChunks()) {
                currentUploadCounter++;
                await tracker.upload();
            } else if (!tracker.allChunksInProgress) {
                tracker.allChunksInProgress = true;
                failed++;
            }
        }
        i++;
    }
    if (localTracker.length == 0) {
		totalUploads = [];
        isUploading = false;
        let progressContainer = document.getElementById("progressContainer");
        progressContainer.innerHTML = "";
        document.getElementById("progress").style.display = "none";
        document.getElementById('link_not_ready').style.display = 'none';
        document.getElementById("status").innerHTML = "";
        if (noMbpsTask)
            clearInterval(noMbpsTask);
        noMbpsTask = undefined;
    }
    isProcessingUploads = false;
}

async function preChunkCheck(index, tracker) {
    if (typeof logging_enabled !== "undefined")
        console.log("Starting chunk check");
    if (!online) return;

    let blob = tracker.file.slice(tracker.chunk_start_data[index], tracker.chunk_end_data[index]);

    preChunkFormData = new FormData();
	let chunkHash = await getSHA256(blob, undefined);
	tracker.chunk_hashes[index] = chunkHash;
    console.log(tracker.chunk_hashes, index, chunkHash);
    preChunkFormData.append("chunk_hash", chunkHash);
    preChunkFormData.append("chunk_check", true);
    let fileext = "";
    if (tracker.file.name.indexOf() != -1)
        fileext = tracker.file.name.split().pop();

    let request = new XMLHttpRequest();
    request.open("POST", 'https://upload.' + domain + '/chunk?' + (window.location.href.split('?')[1] ?? ''), true);
    request.timeout = 30000;
    request.ontimeout = function(e){
        preChunkCheck(index, tracker);
    }
    request.responseType = "json";
    request.onreadystatechange = async function() {
        if (request.readyState === request.DONE) {
            if (request.status == 200 && request.response) {
				request.onreadystatechange = undefined //Deregister callback
                if (typeof logging_enabled !== "undefined")
                    console.log(request.response);
                if (request.response["chunk_exists"]) {
                    progress += (BYTES_PER_CHUNK / tracker.size) * 100;
                    // document.getElementById("progressBarBuffer" + (tracker.index + 1)).style.width = `${Math.trunc(progress-(100*(tracker.fileSizes.length / tracker.size)))}%`;
                    --currentUploadCounter;
                    tracker.chunk_upload_in_finished.push(tracker.chunk_upload_queue.length[index]);
                    tracker.chunk_start_data[index] = undefined
                    tracker.chunk_end_data[index] = undefined
                    if (currentUploadCounter == 0)
                        idleTime = new Date().getTime();

					if (tracker.start >= tracker.size && tracker.chunk_upload_in_finished.length == tracker.total_chunk_count && !tracker.finishedUploading) {
						tracker.finishedUploading = true;

						// Send confirmation
                        console.log('compile_file_' + tracker.fileId, tracker.chunk_hashes);
						let confirmationData = new FormData();
						confirmationData.append("compile_file", tracker.chunk_hashes);
						confirmationData.append("file_id", tracker.fileId);
                        confirmationData.append("extension", fileext);
                        confirmationData.append("folder", folderid);
                        confirmationData.append("name", tracker.file.name);
                        confirmationData.append("session_id", cookie('sf_session_id'));
                        // fetch('https://upload.' + domain + '/chunk?compile&delete_time=' + starfiles.delete_time + '&public=' + starfiles.public + '&' + (window.location.href.split('?')[1] ?? ''), {
                        //     method: 'POST',
                        //     headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        //     body: new URLSearchParams(confirmationData),
                        //     mode: 'no-cors'
                        // })
                        // .then((response) => response.json())
                        // .then((data) => console.log('bbbbb', data));

                        function compileFile(){
                            var xmlHttp = new XMLHttpRequest();
                            xmlHttp.open("POST", 'https://upload.' + domain + '/chunk?compile&delete_time=' + starfiles.delete_time + '&public=' + starfiles.public + '&' + (window.location.href.split('?')[1] ?? ''), false)
                            xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                            xmlHttp.onerror = function(){
                                compileFile()
                            };
                            xmlHttp.send(new URLSearchParams(confirmationData));
                            data = JSON.parse(xmlHttp.responseText);

                            if(data["status"]){
                                document.getElementById("progressBar" + (tracker.index + 1)).hidden = true;
                                if (typeof logging_enabled !== "undefined")
                                    console.log("Finished uploading");
                            }else
                                finish(data['message'] + '<br>');
                        }
                        compileFile();
                        progress += (BYTES_PER_CHUNK / tracker.size) * 100;
                        // document.getElementById("progressBarBuffer" + (tracker.index + 1)).style.width = `${Math.trunc(progress-(100*(tracker.fileSizes.length / tracker.size)))}%`;
                        startUploads();
                    }

                    tracker.fileSizes[index] = BYTES_PER_CHUNK;
                    let total = tracker.fileSizes.reduce((total, num) => total + num);
                    document.getElementById("preuploadoutput").innerHTML = "";
                    if (!online) return;
                    let trackerSize = tracker.size > 0 ? tracker.size : 0;
                    let percentComplete = Math.round(100 * (total / trackerSize));
                    percentComplete = percentComplete > 100 ? 100 : percentComplete;
                    if(document.getElementById("progressBar" + (tracker.index + 1)))
                        document.getElementById("progressBar" + (tracker.index + 1)).style.width = `${Math.trunc(percentComplete)}%`;
                    totalProgressHandler();
                    if (!noMbpsTask)
                        noMbpsTask = setInterval(() => {
                            if (!isProcessingUploads) {
                                clearInterval(noMbpsTask)
                            }
                            totalProgressHandler()
                        }, 1000);
                } else {
                    if (!online) return;
                    fd = new FormData();
                    fd.append("upload", blob, tracker.file.name);
                    fd.append("file_id", tracker.fileId);
					fd.append("chunk_hash", tracker.chunk_hashes[index]);
                    fd.append("filesize", tracker.size);
                    fd.append("chunksize", blob.size);
                    let fileext = "";
                    if (tracker.file.name.indexOf() != -1)
                        fileext = tracker.file.name.split().pop();
                    let inner_request = new XMLHttpRequest();
                    inner_request.addEventListener("error", errorHandler, !1);
                    inner_request.addEventListener("abort", abortHandler, !1);
                    inner_request.open("POST", "https://upload." + domain + '/chunk?' + (window.location.href.split('?')[1] ?? ''), true); // https://cors-anywhere.herokuapp.com/https://starfiles.co/api/upload.php
                    inner_request.setRequestHeader('Access-Control-Allow-Origin', '*');
                    inner_request.timeout = 300000;
                    inner_request.ontimeout = function(e){
                        preChunkCheck(index, tracker);
                    }
                    inner_request.upload.onprogress = async(ev) => {
                        if (typeof logging_enabled !== "undefined")
                            console.log('onprogress called');
                        tracker.fileSizes[index] = ev.loaded;
                        let total = tracker.fileSizes.reduce((total, num) => total + num);
                        document.getElementById("preuploadoutput").innerHTML = "";
                        if (!online)
                            return;
                        let trackerSize = tracker.size > 0 ? tracker.size : 0;
                        let percentComplete = Math.round(100 * (total / trackerSize));
                        percentComplete = percentComplete > 100 ? 100 : percentComplete;
                        if(document.getElementById("progressBar" + (tracker.index + 1)))
                            document.getElementById("progressBar" + (tracker.index + 1)).style.width = `${Math.trunc(percentComplete)}%`;
                        totalProgressHandler();
                        if (!noMbpsTask)
                            noMbpsTask = setInterval(() => {
								if (!isProcessingUploads) {
									clearInterval(noMbpsTask)
								}
								totalProgressHandler() 
							}, 1000);
                    };
                    inner_request.onreadystatechange = async function() {
                        if (inner_request.readyState === inner_request.DONE) {
                            if (inner_request.status == 200 && inner_request.response) {
								inner_request.upload.onprogress = undefined;
								inner_request.onreadystatechange = undefined;
								tracker.chunk_start_data[index] = undefined;
                                tracker.chunk_end_data[index] = undefined;
                                if (typeof logging_enabled !== "undefined")
                                    console.log(inner_request.response);
                                --currentUploadCounter;
								tracker.chunk_upload_in_finished.push(tracker.chunk_upload_in_progress.indexOf(index));
								await startUploads();
								if(tracker.start >= tracker.size && tracker.chunk_upload_in_finished.length == tracker.total_chunk_count && !tracker.finishedUploading){
                                    tracker.finishedUploading = true;

									// Send confirmation
                                    console.log('compile_file_' + tracker.fileId, tracker.chunk_hashes);
                                    let confirmationData = new FormData();
                                    confirmationData.append("compile_file", tracker.chunk_hashes);
                                    confirmationData.append("file_id", tracker.fileId);
                                    confirmationData.append("extension", fileext);
                                    confirmationData.append("name", tracker.file.name);
                                    confirmationData.append("folder", folderid);
                                    confirmationData.append("session_id", cookie('sf_session_id'));

                                    function compileFile(){
                                        var xmlHttp = new XMLHttpRequest();
                                        xmlHttp.open("POST", 'https://upload.' + domain + '/chunk?compile&delete_time=' + starfiles.delete_time + '&public=' + starfiles.public + '&' + (window.location.href.split('?')[1] ?? ''), false)
                                        xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                                        xmlHttp.onerror = function(){
                                            compileFile()
                                        };
                                        xmlHttp.send(new URLSearchParams(confirmationData));
                                        data = JSON.parse(xmlHttp.responseText);
                                        if (data["status"]) {
                                            document.getElementById("progressBar" + (tracker.index + 1)).hidden = true;
                                            if (typeof logging_enabled !== "undefined")
                                                console.log("Finished uploading");
                                        }else
                                            finish(data['message'] + '<br>');
                                    }
                                    compileFile();
                                    startUploads();
                                }
                                if (currentUploadCounter == 0)
                                    idleTime = new Date().getTime();
                            } else {
                                tracker.c_tries[index] = tracker.c_tries[index] + 1;
                                --currentUploadCounter;
                                if (inner_request.status < 500 || inner_request.status > 550 || (!completehandler && tracker.c_tries[index] == 3)) {
                                    if (!tracker.finishedUploading) {
                                        if (currentUploadCounter == 0)
                                            idleTime = new Date().getTime();
                                        if (inner_request.response)
                                            finish(tracker.file.name + " " + inner_request.response["error"] + "<br>");
                                        completehandler = true;
                                    }
                                    let c_upload = tracker.c_uploads.pop();
                                    let c_pre_upload = tracker.c_pre_uploads.pop();
                                    if (c_upload)
                                        c_upload.abort();
                                    if (c_pre_upload)
                                        c_pre_upload.abort();
                                    tracker.chunk_upload_in_progress = [];
                                    tracker.chunk_upload_in_finished = [];
                                    currentUploadCounter = 0;
                                } else {
                                    if (concurrentUploads != 1)
                                        concurrentUploads--;
                                    if (concurrentUploads < 1)
                                        concurrentUploads = 1;
                                    connectionHandler();
									tracker.chunk_upload_in_finished.push(tracker.chunk_upload_in_progress.indexOf(index));
                                    inner_request.abort();
                                    if (typeof logging_enabled !== "undefined")
                                        console.log("Removed chunk " + index + " from list");
                                }
                            }
                            if (!online)
                                return;
                        }
                    };
                    inner_request.onerror = function() { connectionHandler() };
                    tracker.c_uploads[index] = inner_request;
                    tracker.c_tries[index] = 0;
                    try {
                        console.log('---- REQUEST BODY ----'); 
                        for (var pair of fd.entries()) {
                            console.log(pair[0]+ ', ' + pair[1]); 
                        }
                        console.log('----------------------'); 
                        inner_request.send(fd);
                        progress += (BYTES_PER_CHUNK / tracker.size) * 100;
                        // document.getElementById("progressBarBuffer" + (tracker.index + 1)).style.width = `${Math.trunc(progress-(100*(tracker.fileSizes.length / tracker.size)))}%`;
                        
                        if (!startTime)
                            startTime = new Date().getTime();
                    } catch (exception) {
                        connectionHandler();
                    }
                }
                await startUploads();
            }
            if (!online)
                return;
        }
    };
    request.onerror = function() { connectionHandler() };
    try {
        request.send(preChunkFormData);
        if (!startTime)
            startTime = new Date().getTime();
    } catch (exception) {
        connectionHandler();
    }
}

function totalProgressHandler(){
    if(totalUploads.length == 0)
        return false;
    let totalTrackerSize = totalUploads.map((tracker) => (tracker.size > 0 ? tracker.size : 0)).reduce((total, num) => total + num);
    let totalTrackerProgress = totalUploads
        .map((tracker) => {
            if (tracker.fileSizes.length == 0)
                return 0;
            return tracker.fileSizes.reduce((total, num) => total + num);
        }).reduce((total, num) => total + num);
    let percentComplete = Math.round(100 * (totalTrackerProgress / totalTrackerSize));
    if (percentComplete > 100)
        percentComplete = 100;
    // document.title = percentComplete + "% Starfiles - File hosting done simple";
    if (+percentComplete == 100) {
        document.getElementById("status").innerHTML = "Finalizing upload";
        document.getElementById("upload_speed").innerHTML = "0Mbs";
	document.dispatchEvent(evt);
    } else
        document.getElementById("status").innerHTML = percentComplete + "% uploaded";
    let totalTrackerSizeMb = (totalTrackerSize / 1e6).toFixed(2);
    let totalTrackerProgressMb = (totalTrackerProgress / 1e6).toFixed(2);
    totalTrackerProgressMb = +totalTrackerProgressMb > +totalTrackerSizeMb ? totalTrackerSizeMb : totalTrackerProgressMb;
    percentComplete = +percentComplete > 100 ? 100 : percentComplete;
    // document.getElementById("loaded_n_total").innerHTML = totalTrackerProgressMb + "mb/" + totalTrackerSizeMb + "mb";
    let newTime = new Date().getTime() - graceTime;
    if (idleTime) {
        graceTime += +newTime - +idleTime;
        idleTime = undefined;
        newTime = new Date().getTime() - +graceTime;
    }
    let timeDifference = (newTime - startTime) / 1000;
    let speed = +totalTrackerProgressMb / timeDifference;
    let remainingTrackerSizeMb = Math.round((totalTrackerSizeMb - totalTrackerProgressMb + Number.EPSILON) * 100) / 100;
    let remainingTrackerTime = (remainingTrackerSizeMb / speed).toFixed(2);
    if (remainingTrackerTime < 60)
        remainingTrackerTime = (remainingTrackerSizeMb / speed).toFixed(0) + "s";
    else if (remainingTrackerTime < 3600)
        remainingTrackerTime = (remainingTrackerSizeMb / speed / 60).toFixed(1) + "m";
    else
        remainingTrackerTime = (remainingTrackerSizeMb / speed / 60).toFixed(0) + "h";
    if (+percentComplete != 100)
        document.getElementById("upload_speed").innerHTML = Math.round((speed + Number.EPSILON) * 8 * 100) / 100 + "Mbs";
    document.getElementById("remaining_size").innerHTML = remainingTrackerSizeMb + "Mb left";
    document.getElementById("eta").innerHTML = remainingTrackerTime + " remaining";
}

function errorHandler() {
    if (!completehandler)
        finish("Upload failed. Please try again. (1)");
    completehandler = true;
}

function abortHandler() {
    if (!completehandler)
        finish("Upload failed. Please try again. (2)");
    completehandler = true;
}

function finish(output) {
    document.getElementById("output").innerHTML += output;
    document.getElementById("output").style.display = "block";
    let localTracker = totalUploads.filter((tracker) => !tracker.finishedUploading);
    if (localTracker.length == 0) {
        document.getElementById("progress").style.display = "none";
        document.getElementById("preuploadoutput").style.display = "none";
        // document.title = "Starfiles - File hosting done simple";
    }
    sendNotification("Starfiles", '{"body":"File upload finished","icon":"https://' + cdn + '/images/logo-256.png"}');
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate)
        window.navigator.vibrate(200);
}

function notificationClicked(e) {
    e.preventDefault(); // Prevent the browser from focusing the notification's tab
    window.open('/file/' + tracker.fileId, '_blank');
    closeNotification();
}

function connectionHandler() {
    if (checkingConnection) return;
    if (typeof logging_enabled !== "undefined")
        console.log("Checking connection");
    checkingConnection = true;
    let interv = setInterval(async () => {
        let https = new XMLHttpRequest();
        https.open("GET", "/", true);
        https.onload = async function() {
            if (https.readyState == 4) {
                if (https.status == 200) {
                    checkingConnection = false;
                    if (!online) {
                        if (typeof logging_enabled !== "undefined")
                            console.log("Online again, resuming upload");
                        online = true;
                    }
                    clearInterval(interv);
                    if (typeof logging_enabled !== "undefined")
                        console.log("Internet check successful. Starting uploads");
                    if (previousOutput)
                        document.getElementById("output").innerHTML = previousOutput;
                    await startUploads();
                } else
                    onConnectionError();
            }
        };
        https.onerror = function() { onConnectionError() };
        try {
            https.send("https://" + domain + "/");
        } catch (exception) {
            // this is expected
        }
    }, 3000);
}

function onConnectionError() {
    let localTrackers = totalUploads.filter((tracker) => !tracker.finishedUploading);
    for (tracker of localTrackers) {
        for (i = 0; i < tracker.c_uploads.length; i++) {
            let c_upload = tracker.c_uploads[i];
            if (c_upload)
                c_upload.abort();
        }
        for (i = 0; i < tracker.c_pre_uploads.length; i++) {
            let c_pre_upload = tracker.c_pre_uploads[i];
            if (c_pre_upload)
                c_pre_upload.abort();
        }
        tracker.c_pre_uploads = [];
        tracker.c_uploads = [];
        tracker.chunk_upload_in_progress = [];
    }
    document.getElementById("upload_speed").innerHTML = "0Mbs";
    online = false;
    if (typeof logging_enabled !== "undefined")
        console.log("Offline, checking connection in 3 seconds...");
    if (!noInternet) {
        noInternet = true;
        previousOutput = document.getElementById("output").innerHTML;
        document.getElementById("output").innerHTML += "No connection. The upload will automatically resume when connection is re-established.";
    }
}

function open_share_overlay(file) {
    document.body.innerHTML += '<div class="disable-outside-clicks">\
        <div class="share_overlay">\
            <a class="badge stockshare none" href="#" onclick="navigator.share(window.shareData)"><i class="fas fa-share"></i> Share</a>\
            <a class="badge facebook" href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '" target="_blank"><i class="fab fa-facebook-f"></i> Share</a>\
            <a class="badge twitter" href="https://twitter.com/intent/tweet?source=https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '&amp;text=https%3A%2F%2Fstarfiles.co%2Ffile%2F" target="_blank"><i class="fab fa-twitter"></i> Tweet</a>\
            <a class="badge snapchat" href="https://www.snapchat.com/scan?attachmentUrl=https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '%26utm_source%3Dsnapchat" target="_blank" rel="nofollow" style="background:#fffc00;border-style:solid;border-color:black;color:black;border-width:1px;padding:0 8px 0 6px;"><span class="fab fa-snapchat-ghost" style="color:white;-webkit-text-stroke-width:1px;-webkit-text-stroke-color:black"></span> Snap</a>\
            <a class="badge reddit" href="https://www.reddit.com/submit?url=https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '" target="_blank"><i class="fab fa-reddit"></i> Post</a>\
            <a class="badge telegram" href="https://t.me/share/url?url=https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '%26utm_source%3Dtelegram"><span class="fab fa-telegram"></span> Telegram</a>\
            <a class="badge whatsapp" href="whatsapp://send?text=https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '" target="_blank" data-action="share/whatsapp/share"><i class="fab fa-whatsapp"></i> Whatsapp</a>\
            <a class="badge messages" href="sms://?&amp;body=https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '" target="_blank"><i class="fas fa-comment"></i> Message</a>\
            <a class="badge email" href="mailto:?body=https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '"><i class="fa fa-envelope"></i> Email</a>\
            <a href="#" onclick="document.querySelectorAll(\'.share_overlay\').forEach(box =>{box.style.display=\'none\'});document.querySelectorAll(\'.disable-outside-clicks\').forEach(box =>{box.remove()})">Close</a>\
        </div>\
    </div>';
    window.shareData = {
        title: "Starfiles",
        url: "https%3A%2F%2Fstarfiles.co%2Ffile%2F' + file + '%26utm_source%3Dsharebutton",
    }
}

function upload_folder_selected() {
    document.getElementById("uploaded_file").setAttribute("onchange", "uploadFile(true, '" + document.getElementById("upload_folder_selector").value + "')");
}

function upload_folder_checked() {
    if (document.getElementById("upload_folder_checkbox").checked == false) {
        document.getElementById("uploaded_file").removeAttribute("directory");
        document.getElementById("uploaded_file").removeAttribute("webkitdirectory");
        document.getElementById("uploaded_file").removeAttribute("mozdirectory");
        document.getElementById("uploaded_file").setAttribute("onchange", "uploadFile(false)");
        document.getElementById('uploaded_file_text').innerHTML = 'Upload Files';
    } else {
        document.getElementById("uploaded_file").setAttribute("directory", "");
        document.getElementById("uploaded_file").setAttribute("webkitdirectory", "");
        document.getElementById("uploaded_file").setAttribute("mozdirectory", "");
        document.getElementById("uploaded_file").setAttribute("onchange", "uploadFile(true, '" + document.getElementById("upload_folder_selector").value + "')");
        document.getElementById('uploaded_file_text').innerHTML = 'Upload Folder';
    }
}

if (!window.Clipboard) {
    var pasteCatcher = document.createElement("div");
    pasteCatcher.setAttribute("contenteditable", ""); // Firefox support
    // Hide
    pasteCatcher.style.opacity = 0;
    // Add
    document.body.appendChild(pasteCatcher);
    // Focus on element
    pasteCatcher.focus();
    document.addEventListener("click", function(){pasteCatcher.focus()});
}

// Define functions
async function uploadClipboard(source, name) {
    let formData2 = new FormData();
    formData2.append("datauri", source);
    formData2.append("name", name);
    const response = await fetch("http" + (typeof tor_user === "undefined" || !tor_user ? 's' : '') + '://api.' + domain + '/upload/upload_file', {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: "POST",
        mode: 'cors', // no-cors, *cors, same-origin
        body: new URLSearchParams(formData2)
    });
    return JSON.parse(await response.text()).file;
}
let blobToBase64 = function(blob) {
    return new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = function() { resolve(reader.result) };
        reader.readAsDataURL(blob);
    });
};
// Handle pastes
window.addEventListener("paste", async function (e) {
    if (e.clipboardData) { // Check if Clipboard API is supported
        // Get clipboard data
        let items = e.clipboardData.items || e.originalEvent.clipboardData.items;
        for (let i = 0; i < items.length; i++) { // Check for images
            if (items[i].kind == 'file') {
                document.getElementById("preuploadoutput").innerHTML = "Uploading";
                document.getElementById("preuploadoutput").style.display = "block";
                let source = items[i].getAsFile(); // Convert clipboard data to file
                let name;
                if (source) {
                    name = source.name;
                    console.log(source);
                    file = await blobToBase64(source);
                    if(xenhtml)
                        uploadClipboard(file, name).then(response => finish('<a href="#" onclick="window.location = \'https://' + domain + '/file/' + response + '\';setTimeout(function(){window.location.reload()},1500)" target="_blank" class="banner banner-small">' + name + '&nbsp;<i class="fas fa-link"></i></a>&nbsp;<i onclick="open_share_overlay(\'' + response + '\')" class="fas fa-share-square"></i><br>'));
                    else
                        uploadClipboard(file, name).then(response => finish('<a href="https://' + domain + '/file/' + response + '" target="_blank" class="banner banner-small">' + name + '&nbsp;<i class="fas fa-link"></i></a>&nbsp;<i onclick="open_share_overlay(\'' + response + '\')" class="fas fa-share-square"></i><br>'));
                }
            }
        }
    } else { // Clipboard API not supported
        // Get pasted data from contenteditable element

        // Store the pasted content in a variable
        var child = pasteCatcher.childNodes[0];
        // Clear the innerhtml to prepare for future pastes
        pasteCatcher.innerHTML = "";
        // If the user pastes an image, the src attribute will represent the image as a base64 encoded string.
        if (child && child.tagName === "IMG")
            console.log(createImage(child.src));
    }
});

function shuffle(originalArray) {
    let array = [].concat(originalArray);
    let currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}
