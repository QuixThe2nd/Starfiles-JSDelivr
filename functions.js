function search(){
    var input, filter, div, a, span, i, txtValue;
        input = document.getElementById("search");
        filter = input.value.toUpperCase();
        recents = document.getElementById("recents");
        file = recents.getElementsByTagName("a");
    for (i = 0; i < file.length; i++) {
        a = file[i];
        txtValue = a.textContent || a.innerText;
        if(txtValue.toUpperCase().indexOf(filter) > -1){
            file[i].style.display = "";
        }else{
            file[i].style.display = "none";
        }
    }
}
var setInnerHTML = function(elm, html){
    elm.innerHTML = html;
    Array.from(elm.querySelectorAll("script")).forEach( oldScript => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes)
            .forEach( attr => newScript.setAttribute(attr.name, attr.value) );
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
};
function getScript(url){
    var js_script = document.createElement('script');
    js_script.src = url;
    document.getElementsByTagName('head')[0].appendChild(js_script);
}
function getStyle(url, media){
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.media = media;
    style.href = url;
    document.getElementsByTagName('head')[0].appendChild(style);
}
function functionExists(functionSelected){
    if(typeof functionSelected === 'function')
        return true;
    else
        return false;
}
function showQrCode(triggerelm, tooltipelm){
    const button = document.querySelector(triggerelm);
    const tooltip = document.querySelector(tooltipelm);
    let popperInstance = null;
    function create() {
        popperInstance = Popper.createPopper(button, tooltip, {
        modifiers: [
            {
            name: 'offset',
            options: {
                offset: [0, 8],
            },
            },
        ],
        });
    }
    function destroy() {
        if (popperInstance) {
        popperInstance.destroy();
        popperInstance = null;
        }
    }
    function show() {
        tooltip.setAttribute('data-show', '');
        create();
    }
    function hide() {
        tooltip.removeAttribute('data-show');
        destroy();
    }
    const showEvents = ['mouseenter', 'focus'];
    const hideEvents = ['mouseleave', 'blur'];
    showEvents.forEach(event => {
        button.addEventListener(event, show);
    });
    hideEvents.forEach(event => {
        button.addEventListener(event, hide);
    });
}
function initNotifications(){
    const close_notification_trigger = new Event('close_notification_trigger');
    if(!("Notification" in window)){
        return 'unsupported';
    }else if(Notification.permission === "granted" || Notification.permission === "denied"){
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
    }else{
        console.log(permission);
    }
    notification.onclick = function(e){
        if(functionExists(notificationClicked))notificationClicked(e);
    };
    notification.onclose = function(){
        if(functionExists(notificationClosed))notificationClosed();
    };
    notification.onshow = function(){
        if(functionExists('notificationShown'))notificationShown();
    };
    window.addEventListener('close_notification_trigger', function (e) {
        notification.close();
    }, false);
    
}
function closeNotification(){
    window.dispatchEvent(close_notification_trigger);
}
cookie = key=>((new RegExp((key || '=')+'=(.*?); ','gm')).exec(document.cookie+'; ') ||['',null])[1]
function setCookie(name, value, days){
    var expires = "";
    if(days){
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function isset(variable){
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