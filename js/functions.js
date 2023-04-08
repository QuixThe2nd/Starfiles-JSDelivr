var functionsloaded = true;

// Functions
function getScript(url){
    var js_script = document.createElement('script');
    js_script.src = url;
    document.getElementsByTagName('head')[0].appendChild(js_script);
}
function setInnerHTML(elm, html){
    elm.innerHTML = html;
    Array.from(elm.querySelectorAll("script")).forEach( oldScript => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes)
            .forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
};
function getStyle(url, media){
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.media = media;
    style.href = url;
    document.getElementsByTagName('head')[0].appendChild(style);
}
function initNotifications(){
    const close_notification_trigger = new Event('close_notification_trigger');
    if(!("Notification" in window)){
        return 'unsupported';
    }else if(Notification.permission === "granted" || Notification.permission === "denied"){
        if(isset('logging_enabled'))
            console.log('Notifications ' + Notification.permission);
        return Notification.permission;
    }else{
        Notification.requestPermission().then(function (permission) {
            return permission;
        });
    }
}
function sendNotification(title, configobj){
    var config = JSON.parse(configobj);
    permission = initNotifications();
    if(permission == "granted"){
        var notification = new Notification(title, {
            body: config.body,
            icon: config.icon,
            dir: config.dir,
            lang: config.lang,
            requireInteraction: config.requireInteraction,
            silent: config.silent
        });
    }else if(isset('logging_enabled'))
            console.log(permission);
    if(typeof notification != 'undefined'){
        notification.onclick = function(e){
            if(functionExists(notificationClicked))notificationClicked(e);
        };
        notification.onclose = function(){
            if(functionExists(notificationClosed))notificationClosed();
        };
        notification.onshow = function(){
            if(functionExists('notificationShown'))notificationShown();
        };
    }
    window.addEventListener('close_notification_trigger', function (e) {
        notification.close();
    }, false);
    
}
function closeNotification(){
    window.dispatchEvent(close_notification_trigger);
}
function cookie(name){
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if(match)
        return match[2];
}
function setCookie(name, value, days){
    var expires = "";
    if(days){
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }

    if(typeof domain === 'undefined')
        domain = window.location.hostname;
    document.cookie = name + "=" + (value || "")  + expires + ";path=/;domain=." + domain;
}
function delete_cookie(name){
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
function functionExists(functionSelected){
    if(typeof functionSelected === 'function')
        return true;
    else
        return false;
}
function isset(variable, global=false){
    if(global)
        return typeof window[variable] !== typeof undefined;
    else
        return typeof this[variable] !== typeof undefined;
}
function empty(variable){
    return variable == '';
}
function element_id_exists(element){
    if(document.getElementById(element))
        return true;
    else
        return false;
}
function remove_array_item(array, exclude){
    array = array.filter(function(item){
        return item !== exclude;
    });
}
async function httpGet(url){
    await fetch(url).then(function(response) {
        response.text().then(function(text) {
            return text;
        });
    });
}
const serverOnline = async (url) =>{
    try{
        const online = await fetch(url);
        return online.status >= 200 && online.status < 300;
    }catch(err){
        return false;
    }
};
// await serverOnline('/');
function sleep(timeout) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
}
function wait(timeout){
    sleep(timeout);
}
// await sleep(5000);
// await wait(5000);
theme = {
    import: function(url){
        setCookie('custom_theme', url, 30);
        return true;
    },
    unset: function(){
        delete_cookie('custom_theme');
        return true;
    }
};

Object.defineProperty(Array.prototype, 'last', {
  get() {
    return this[this.length - 1]; 
  }
});

// Post Request
function post(url, data) {
    return new Promise((res, rej) => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4)
                if (xhr.status == 200)
                    res(xhr.responseText)
                else
                    rej({ code: xhr.status, text: xhr.responseText })
        }
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
    })
}
