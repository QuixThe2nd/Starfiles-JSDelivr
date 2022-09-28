var totalUploads = [];
var BYTES_PER_CHUNK = parseInt(2097152, 10);
var isUploading = false;
var finishCount = 0;
var completehandler = false;
var currentUploadCounter = 0;
var startTime;
var previousCheckTime;
var speeds = [];
var graceTime = 0;
var idleTime;
var previousOutput;
var noMbpsTask;
var isProcessingUploads = false;
var online = true;
var checkingConnection = false;

var lastEight = window.location.href.substr(window.location.href.length - 8);
if(lastEight == '?saunder'){
  var MAX_FILE_SIZE = parseInt(1024 * 1024 * 1024 * 5, 10); // 5gb
  var concurrentUploads = 1;
}else{
  var MAX_FILE_SIZE = parseInt(1024 * 1024 * 1024 * 2, 10); // 2gb
  var concurrentUploads = 10;
}

cookie = key=>((new RegExp((key || '=')+'=(.*?); ','gm')).exec(document.cookie+'; ') ||['',null])[1];

var params = window.location.href.split('?')[1];
let dropperelement = document.getElementById('dropperid');
if(dropperelement){
    var dropper = dropperelement.getAttribute('data');
}
if(params === undefined){
  var params = '?dropper=' + dropper + '&folder=' + window.location.href.substr(window.location.href.length - 12);
}else{
  var params = '?' + params + '&dropper=' + dropper + '&folder=' + window.location.href.substr(window.location.href.length - 19).substring(0, 10);
}
function getScript(url){
    var js_script = document.createElement('script');
    js_script.src = url;
    document.getElementsByTagName('head')[0].appendChild(js_script);
}
getScript('https://cdn.jsdelivr.net/combine/npm/crypto-js@4/crypto-js.min.js,npm/jszip@3/dist/jszip.min.js');
class UploadTracker {
  constructor(file) {
    this.file = file;
    this.size = file.size;
    this.number_of_chunks = Math.max(Math.ceil(this.size / BYTES_PER_CHUNK), 1);
    this.chunk_index = 0;
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
  }

  upload() {
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
    console.log("Starting upload " + first);
    preChunkCheck(first, this);
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
}

async function uploadFile(isFolder) {
  let progressContainer = document.getElementById("progressContainer");
  let zip = new JSZip();
  let folderName = undefined;
  for (let file of document.getElementById("uploaded_file").files) {
    if (file.size < MAX_FILE_SIZE) {
      window.onbeforeunload = confirmExit;
      function confirmExit() {
        return "You have attempted to leave this page. An upload is in progress. Are you sure you want to leave?";
      }
      document.getElementById("preuploadoutput").innerHTML = "Preparing Upload";
      if (isFolder) {
        if (!folderName) folderName = file.webkitRelativePath.split('/')[0];
        let split = file.webkitRelativePath.split("/");
        split.shift();

        zip.file(split.join("/"), file, { binary: true, createFolders: true });
      } else {
        let uploadTracker = new UploadTracker(file);
        uploadTracker.filehash = await getSHA256(file, undefined);
        totalUploads.push(uploadTracker);
        progressContainer.innerHTML += `<div class="progressbar"><div class="progressbarfill" id="progressBar${totalUploads.length}" style="width: 0%"></div></div>`;
        //progressContainer.innerHTML += `<progress id="progressBar${totalUploads.length}" value="0" max="${uploadTracker.size}" style="width: 90%"></progress>`;
      }
    } else {
      alert("Files cannot be larger then 2gb");
    }
  }

  if (isFolder) {
    zip.generateAsync({type: 'blob'}).then(async file => {
      if (file.size > MAX_FILE_SIZE) {
        alert("Files cannot be larger then 2gb");
        return;
      }
      
      file.name = folderName + ".zip";
      let uploadTracker = new UploadTracker(file);
      uploadTracker.filehash = await getSHA256(file, undefined);
      totalUploads.push(uploadTracker);
      progressContainer.innerHTML += `<div class="progressbar"><div class="progressbarfill" id="progressBar${totalUploads.length}" style="width: 0%"></div></div>`;
      //progressContainer.innerHTML += `<progress id="progressBar${totalUploads.length}" value="0" max="${uploadTracker.size}" style="width: 90%"></progress>`;
      preStartUploads();
    })
  } else {
    preStartUploads();
  }
}

function preStartUploads() {
  document.getElementById("progress").style.display = "block";
  if (!isUploading) {
    isUploading = true;
    completehandler = false;
    startTime = undefined;
    idleTime = undefined;
    graceTime = 0;
    console.log("Starting upload");
    startUploads();
  }
}

function readChunked(file, chunkCallback, endCallback) {
  var fileSize = file.size;
  var chunkSize = 4 * 1024 * 1024; // 4MB
  var offset = 0;
  var reader = new FileReader();
  reader.onload = function () {
    if (reader.error) {
      endCallback(reader.error || {});
      return;
    }
    offset += reader.result.length;
    // callback for handling read chunk
    chunkCallback(reader.result, offset, fileSize);
    if (offset >= fileSize) {
      endCallback(null);
      return;
    }
    readNext();
  };
  reader.onerror = function (err) {
    endCallback(err || {});
  };
  function readNext() {
    var fileSlice = file.slice(offset, offset + chunkSize);
    reader.readAsBinaryString(fileSlice);
  }
  readNext();
}

function getSHA256(blob, cbProgress) {
  return new Promise((resolve, reject) => {
    var sha256 = CryptoJS.algo.SHA256.create();
    readChunked(
      blob,
      (chunk, offs, total) => {
        sha256.update(CryptoJS.enc.Latin1.parse(chunk));
        if (cbProgress) {
          cbProgress(offs / total);
        }
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          var hash = sha256.finalize();
          var hashHex = hash.toString(CryptoJS.enc.Hex);
          resolve(hashHex);
        }
      }
    );
  });
}

function startUploads() {
  if (!online || checkingConnection || isProcessingUploads) return;
  isProcessingUploads = true;
  // 2 - 1 = 1 - true
  // 2 - 15 = 13 - false
  let i = currentUploadCounter;
  let failed = 0;
  let localTracker = totalUploads.filter(
    (tracker) => !tracker.finishedUploading
  );
  console.log(localTracker.length);
  if (i >= concurrentUploads) {
    console.log("Preventing start of new upload. I:" + i + " Concurrent:" + concurrentUploads + " Counter:" + currentUploadCounter);
  } else {
    console.log("Attempting upload. I:" + i + " Concurrent:" + concurrentUploads + " Counter:" + currentUploadCounter);
  }
  while (
    i < concurrentUploads &&
    failed < totalUploads.length &&
    localTracker.length != 0
  ) {
    let tracker = localTracker[i % totalUploads.length];
    if (tracker) {
      if (tracker.hasRemainingChunks()) {
        currentUploadCounter++;
        tracker.upload();
      } else {
        if (!tracker.allChunksInProgress) {
          tracker.allChunksInProgress = true;
          failed++;
        }
      }
    }
    i++;
  }
  if (localTracker.length == 0) {
    totalUploads = [];
    speeds = [];
    isUploading = false;
    let progressContainer = document.getElementById("progressContainer");
    progressContainer.innerHTML = "";
    document.getElementById("progress").style.display = "none";
    document.getElementById("status").innerHTML = "";
    document.getElementById("upload_speed").innerHTML = "calculating";
    //document.getElementById("loaded_n_total").innerHTML = "0MB/" + "0MB";
    if (noMbpsTask) clearInterval(noMbpsTask);
    noMbpsTask = undefined;
  }
  isProcessingUploads = false;
}

function preChunkCheck(index, tracker) {
  console.log("Starting chunk check");
  if (!online) return;

  let blob = tracker.file.slice(
    tracker.chunk_start_data[index],
    tracker.chunk_end_data[index]
  );

  fd = new FormData();
  fd.append("chunk_number", index + 1);
  fd.append("number_of_chunks", tracker.number_of_chunks);
  fd.append("filehash", tracker.filehash);
  fd.append("filesize", tracker.size);
  fd.append("chunksize", blob.size);
  fd.append("chunk_check", true);
  let fileext = "";
  if (tracker.file.name.indexOf() != -1) {
    fileext = tracker.file.name.split().pop();
  }
  fd.append("extension", fileext);
  let request = new XMLHttpRequest();
  
  request.open("POST", "https://api.starfiles.co/upload" + params, true);
  request.responseType = "json";
  request.onreadystatechange = function () {
    if (request.readyState === request.DONE) {
      if (request.status == 200 && request.response) {
        console.log(request.response);
        if (request.response["chunk_exists"] === true) {
          console.log('Chunk exists');
          --currentUploadCounter;
          tracker.chunk_start_data.splice(index, 1);
          tracker.chunk_end_data.splice(index, 1);

          if (currentUploadCounter == 0) {
            idleTime = new Date().getTime();
          }
        } else {
          console.log("Chunk DOES NOT exists");
          chunkUpload(index, tracker, blob);
        }
        startUploads();
      }
      
      if (!online) return;
    }
  };

  request.onerror = function () {
    connectionHandler();
  };

  try {
    request.send(fd);
    if (!startTime) startTime = new Date().getTime();
  } catch (exception) {
    connectionHandler();
  }
}

function chunkUpload(index, tracker, blob) {
  if (!online) return;

  fd = new FormData();
  fd.append("upload", blob, tracker.file.name);
  fd.append("chunk_number", index + 1);
  fd.append("number_of_chunks", tracker.number_of_chunks);
  fd.append("filehash", tracker.filehash);
  fd.append("filesize", tracker.size);
  fd.append("chunksize", blob.size);
  let fileext = "";
  if (tracker.file.name.indexOf() != -1) {
    fileext = tracker.file.name.split().pop();
  }
  fd.append("extension", fileext);
  let request = new XMLHttpRequest();
  request.upload.addEventListener(
    "progress",
    (ev) => {
      tracker.fileSizes[index] = ev.loaded;
      let total = tracker.fileSizes.reduce((total, num) => total + num);
      progressHandler(total, tracker);
    },
    !1
  );
  request.addEventListener("error", errorHandler, !1);
  request.addEventListener("abort", abortHandler, !1);
  request.open(
    "POST",
    "https://api.starfiles.co/upload" + params,
    true
  ); // https://cors-anywhere.herokuapp.com/https://api.starfiles.co/upload.php
  request.responseType = "json";
  request.onreadystatechange = function () {
    if (request.readyState === request.DONE) {
      if (request.status == 200 && request.response) {
        console.log(request.response);
        --currentUploadCounter;
        if (request.response["status"] === "true") {
          if (!tracker.finishedUploading) {
            document.getElementById(
              "progressBar" + (tracker.index + 1)
            ).hidden = true;
            tracker.finishedUploading = true;
            console.log("Finished uploading");
            console.log("URL: " + window.location.href);
            var lastNine = window.location.href.substr(window.location.href.length - 9);
            console.log("Checking for redirect: " + lastNine);
            if(lastNine == '?redirect')
            if(typeof window.starfiles_url == "undefined")
              finish(tracker.file.name + ' <a href="/file/' + request.response["file"] + '" target="_blank">Open</a><br>');
            else
              finish(tracker.file.name + ' <a href="https://starfiles.co/file/' + request.response["file"] + '" target="_blank">Open</a><br>');
          } else {
            tracker.chunk_start_data.splice(index, 1);
            tracker.chunk_end_data.splice(index, 1);
          }
          if (currentUploadCounter == 0) {
            idleTime = new Date().getTime();
          }
        }
        startUploads();
      } else {
        tracker.c_tries[index] = tracker.c_tries[index] + 1;
        --currentUploadCounter;
        if (
          request.status < 500 ||
          request.status > 550 ||
          (!completehandler && tracker.c_tries[index] == 3)
        ) {
          if (!tracker.finishedUploading) {
            if (currentUploadCounter == 0) {
              idleTime = new Date().getTime();
            }
            if (request.response)
              finish(
                tracker.file.name + " " + request.response["error"] + "<br>"
              );
            completehandler = true;
          }
          let c_upload = tracker.c_uploads.pop();
          let c_pre_upload = tracker.c_pre_uploads.pop();
          if (c_upload) c_upload.abort();
          if (c_pre_upload) c_pre_upload.abort();
          tracker.chunk_upload_in_progress = [];
          currentUploadCounter = 0;
        } else {
          if (concurrentUploads != 1) {
            concurrentUploads--;
          }
          if (concurrentUploads < 1) concurrentUploads = 1;
          connectionHandler();
          tracker.chunk_upload_in_progress.splice(
            tracker.chunk_upload_in_progress.indexOf(index),
            1
          );
          request.abort();
          console.log("Removed chunk " + index + " from list");
        }
      }
      if (!online) return;
    }
  };
  request.onerror = function () {
    connectionHandler();
  };
  tracker.c_uploads[index] = request;
  tracker.c_tries[index] = 0;
  try {
    request.send(fd);
    if (!startTime) startTime = new Date().getTime();
  } catch (exception) {
    connectionHandler();
  }
}

function progressHandler(progress, tracker) {
  document.getElementById("preuploadoutput").innerHTML = "";
  if (!online) return;

  let trackerSize = tracker.size > 0 ? tracker.size : 0;

  let percentComplete = Math.round(100 * (progress / trackerSize));
  percentComplete = percentComplete > 100 ? 100 : percentComplete;

  document.getElementById(
    "progressBar" + (tracker.index + 1)
  ).style.width = `${Math.trunc(percentComplete)}%`;
  totalProgressHandler();
  if (!noMbpsTask) {
    noMbpsTask = setInterval(() => {
      totalProgressHandler();
    }, 1000);
  }
}

function totalProgressHandler() {
  let totalTrackerSize = totalUploads
    .map((tracker) => (tracker.size > 0 ? tracker.size : 0))
    .reduce((total, num) => total + num);
  let totalTrackerProgress = totalUploads
    .map((tracker) => {
      if (tracker.fileSizes.length == 0) return 0;
      return tracker.fileSizes.reduce((total, num) => total + num);
    })
    .reduce((total, num) => total + num);
  let percentComplete = Math.round(
    100 * (totalTrackerProgress / totalTrackerSize)
  );
  percentComplete = percentComplete > 100 ? 100 : percentComplete;
//  document.title = percentComplete + "% Starfiles - File hosting done simple";
  if (+percentComplete == 100) {
    document.getElementById("status").innerHTML = "Finalizing upload";
    document.getElementById("upload_speed").innerHTML = "0Mbs";
  } else {
    document.getElementById("status").innerHTML = percentComplete + "% uploaded";
  }
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
  if (remainingTrackerTime < 60) {
    remainingTrackerTime = (remainingTrackerSizeMb / speed).toFixed(0) + "s";
  } else if (remainingTrackerTime < 3600) {
    remainingTrackerTime = (remainingTrackerSizeMb / speed / 60).toFixed(1) + "m";
  } else {
    remainingTrackerTime = (remainingTrackerSizeMb / speed / 60).toFixed(0) + "h";
  }
  if (+percentComplete != 100) {
    document.getElementById("upload_speed").innerHTML = Math.round((speed + Number.EPSILON) * 8 * 100) / 100 + "Mbs";
  }
  document.getElementById("remaining_size").innerHTML = remainingTrackerSizeMb + "mb left";
  document.getElementById("eta").innerHTML = remainingTrackerTime + " remaining";
}

function errorHandler() {
  if (!completehandler) {
    finish("Error 1.1");
  }
  completehandler = true;
}

function abortHandler() {
  if (!completehandler) {
    finish("Error 6.1");
  }
  completehandler = true;
}

function finish(output) {
  document.getElementById("output").innerHTML += output;
  document.getElementById("output").style.display = "block";
  let localTracker = totalUploads.filter(
    (tracker) => !tracker.finishedUploading
  );
  if (localTracker.length == 0) {
    document.getElementById("progress").style.display = "none";
//    document.title = "Starfiles - File hosting done simple";
  }
}

function connectionHandler() {
  if (checkingConnection) return;
  console.log("Checking connection");
  checkingConnection = true;
  let interv = setInterval(() => {
    let https = new XMLHttpRequest();
    https.open("GET", "/", true);
    https.onload = function () {
      if (https.readyState == 4) {
        if (https.status == 200) {
          checkingConnection = false;
          if (!online) {
            console.log("Online again, resuming upload");
            online = true;
          }
          clearInterval(interv);
          console.log("Internet check successfull. Starting uploads");
          if (previousOutput) {
            document.getElementById("output").innerHTML = previousOutput;
          }
          startUploads();
        } else {
          onConnectionError();
        }
      }
    };
    https.onerror = function () {
      onConnectionError();
    };
    try {
      https.send("https://starfiles.co/");
    } catch (exception) {
      // this is expected
    }
  }, 3000);
}

function onConnectionError() {
  let localTrackers = totalUploads.filter(
    (tracker) => !tracker.finishedUploading
  );
  for (tracker of localTrackers) {
    for (i = 0; i < tracker.c_uploads.length; i++) {
      let c_upload = tracker.c_uploads[i];
      if (c_upload) c_upload.abort();
    }
    for (i = 0; i < tracker.c_pre_uploads.length; i++) {
      let c_pre_upload = tracker.c_pre_uploads[i];
      if (c_pre_upload) c_pre_upload.abort();
    }
    tracker.c_pre_uploads = [];
    tracker.c_uploads = [];
    tracker.chunk_upload_in_progress = [];
  }
  document.getElementById("upload_speed").innerHTML = "0Mbs";
  online = false;
  console.log("Offline, checking connection in 3 seconds...");
  if (!previousOutput) {
    previousOutput = document.getElementById("output").innerHTML;
    document.getElementById("output").innerHTML += "No connection. The upload will automatically resume when connection is re-established.";
  }
}
