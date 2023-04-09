if(typeof getScript === "undefined"){
    function getScript(url){
        var js_script = document.createElement('script');
        js_script.src = url;
        document.getElementsByTagName('head')[0].appendChild(js_script);
    }
}

// paceOptions = {restartOnRequestAfter: false}
window.addEventListener('load', () => {
    if(navigator.doNotTrack !== '1'){
        // Microsoft Clarity
        (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="//www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "7vvzmi3jno");

        function hashFnv32a(str) {
            var i, l, hval = 0x811c9dc5;
            for(i = 0, l = str.length; i < l; i++){
                hval ^= str.charCodeAt(i);
                hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
            }
            return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
        }

        // Google Analytics
        gtag('js', new Date());
        gtag('set', {'user_id': hashFnv32a(cookie('sf_session_id'))});
        gtag('set', 'user_properties',{
            'theme': typeof cookie !== 'undefined' ? cookie('color') : 'null',
            'language': typeof cookie !== 'undefined' ? cookie('lang') : 'null',
            'font': typeof cookie !== 'undefined' ? cookie('font') : 'null',
            'url': window.location.href,
        });
    }

    // Font Awesome
    getScript('//kit.fontawesome.com/5165bd60e9.js');

    // ServiceWorker
    if('serviceWorker' in navigator){
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('https://' + domain + '/sw.js',{scope: '/'})
            .then(function(registration){});
        });
        navigator.serviceWorker.ready.then(function(registration){});
    }
    
    // Load Plugins
    if(localStorage.getItem('plugins')){
        Object.entries(JSON.parse(localStorage.getItem('plugins'))).forEach(e => {
            getScript('https://cdn.jsdelivr.net/gh/' + e[1]['repo'] + '@' + e[1]['expected_version'] + '/' + e[1]['plugin_name'] + '.plugin.stf.js');
        });
    }
    
    // // FingerprintJS
    // if(typeof FingerprintJS !== "undefined"){
    //     var c_value = document.cookie, c_start = c_value.indexOf(" fingerprint_id=");
    //     if(c_start == -1)c_start = c_value.indexOf("fingerprint_id=");
    //     if(c_start == -1) c_value = null;
    //     else{
    //         c_start = c_value.indexOf("=", c_start) + 1;
    //         var c_end = c_value.indexOf(";", c_start);
    //         if(c_end == -1)
    //             c_end = c_value.length;
    //         c_value = unescape(c_value.substring(c_start, c_end));
    //     }
    //     if(!c_value){
    //         FingerprintJS.load({
    //             token: 'zOkuP2oCbSILgsVbnOCt',
    //             tag:{
    //                 public_key: public_key,
    //                 domain: domain,
    //                 path: window.location.pathname,
    //                 ip: ip_address
    //             },
    //             linkedId: public_key
    //         })
    //         .then(fp => fp.get())
    //         .then(result => setCookie("fingerprint_id", result.visitorId, 30))
    //         .catch(error => console.error(error));
    //     }
    // }

    // Execute Plugin
    window.stfplugins = {started:[],installed:[]};
    function init_plugin(meta){
        let plugins = JSON.parse(localStorage.getItem('plugins'));
        Object.entries(plugins).forEach(function(entry, i){
            if(entry[1]['repo'] == meta.repo && entry[1]['plugin_name'] == meta.path){
                plugins[i][1][meta.id] = meta.id;
                plugins[i][1].installed_version = meta.version;
            }
        });
        localStorage.setItem('plugins', JSON.stringify(plugins));
        // Check First Run
        let plugin_first_run = true;
        if(localStorage.getItem('installed')){
            let installed = JSON.parse(localStorage.getItem('installed'));
            Object.entries(installed).forEach(e => {
                if(isset('e')){
                    plugin_first_run = false;
                }
            });
            if(plugin_first_run){
                if(window['install_' + meta.id])
                    localStorage.setItem('installed', '["' + meta.id + '"]');
                else
                    return false;
            }

            if(isset('meta.conflicts')){
                for(var conflict in JSON.parse(meta.conflicts)){
                    for(var child in JSON.parse(localStorage.getItem('installed'))){
                        if(meta.conflicts[conflict] == JSON.parse(localStorage.getItem('installed'))[child]){
                            console.error('Conflict', meta.conflicts[conflict]);
                            return false;
                        }
                    }
                }
            }
            if(isset('meta.dependencies')){
                for(var dependency in JSON.parse(meta.dependencies)){
                    let dependency_found = false;
                    for(var child in JSON.parse(localStorage.getItem('installed'))){
                        if(meta.dependencies[dependency] == JSON.parse(localStorage.getItem('installed'))[child])
                            dependency_found = true;
                    }
                    if(!dependency_found){
                        console.error('Dependency missing', meta.dependencies[dependency]);
                        return false;
                    }
                }
            }
        }else{
            window['install_' + meta.id];
            localStorage.setItem('installed', '["' + meta.id + '"]');
        }
        // Init
        if(typeof meta.compatibility.website != "undefined"){
            if(meta.compatibility.website == true){
                window.stfplugins.started.push(meta.id);
                window['start_' + meta.id]();
            }else
                alert('This plugin is not compatible with this website.');
        }else
            alert('This plugin is not compatible with this website.');
    }
    // Import Plugin
    function importPlugin(repo, plugin_name, version){
        let imported;
        if(localStorage.getItem('plugins')){
            imported = JSON.parse(localStorage.getItem('plugins'));
            imported.push({
                repo: repo,
                expected_version: version,
                plugin_name: plugin_name
            });
        }else{
            imported = [
                {
                    repo: repo,
                    expected_version: version,
                    plugin_name: plugin_name
                }
            ]
        }
        getScript('https://cdn.jsdelivr.net/gh/' + repo + '@' + version + '/' + plugin_name + '.plugin.stf.js');
    }

    // 429 Check
    // if(window.location.href.indexOf('https://' + domain + '/ads/') != 0){
    //     var too_many_requests = false;
    //     var storage_name = "openTabs" + Math.round(+ new Date()/600000);
    //     window.addEventListener("load", function(e){
    //         var openTabs = window.localStorage.getItem(storage_name);
    //         if(openTabs){
    //             openTabs++;
    //             window.localStorage.setItem(storage_name, openTabs)
    //         }else
    //             window.localStorage.setItem(storage_name, 1)
    //         calculateTabCount();
    //     })
    //     window.addEventListener("unload", function(e){
    //         e.preventDefault();
    //         var openTabs = window.localStorage.getItem(storage_name);
    //         if(openTabs){
    //             openTabs--;
    //             window.localStorage.setItem(storage_name, openTabs)
    //         }
    //         e.returnValue = '';
    //     });
    //     window.addEventListener('storage', function(e){
    //         calculateTabCount();
    //     })
    //     function calculateTabCount(){
    //         if(window.localStorage.getItem(storage_name) > 6){
    //             too_many_requests = true;
    //             document.head.innerHTML = '';
    //             document.body.innerHTML = '<h1>You have too many tabs open, please close some.</h1>';
    //         }else if(too_many_requests){
    //             too_many_requests = false;
    //             location.reload();
    //         }
    //     }
    // }

    // Console Warning
    function r(s,i,n=0){return s.repeat(i)+(n?'\n':'')};
    console.log(r(' ',21)+'.**\n'+r(' ',22)+'***\n'+r(' ',23)+'***\n'+r(' ',19)+'**   ***\n'+r(' ',18)+'***    ***\n'+r(' ',17)+'***     ***\n '+r('*',18)+'       ***********    ****\n'+r(' ',38)+'****,\n      *****'+r(' ',24)+'****\n          ****'+r(' ',18)+'****\n             ***'+r(' ',14)+'***\n            ***'+r(' ',16)+'***\n           ***       ****       **\n           ***   *****  *****    **\n          ***  ***,        *****\n         ***'+r(' ',19)+'*****\n         **'+r(' ',23)+'.**');
    console.log('%cStop!', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cIf someone told you to copy/paste anything from here, they are probably scamming you.', 'color: black; font-size: 30px; font-weight: bold;');
    console.log('%cPasting anything here may put your files at risk.', 'color: red; font-size: 30px; font-weight: bold;');
    setInterval(() => {document.getElementsByTagName('body')[0].style.padding = 0}, 500);
});

// Save Input Values
// function cssPath(el){
//     if (!(el instanceof Element)) 
//         return;
//     var path = [];
//     while (el.nodeType === Node.ELEMENT_NODE) {
//         var selector = el.nodeName.toLowerCase();
//         if (el.id) {
//             selector += '#' + el.id;
//             path.unshift(selector);
//             break;
//         } else {
//             var sib = el, nth = 1;
//             while (sib = sib.previousElementSibling) {
//                 if (sib.nodeName.toLowerCase() == selector)
//                 nth++;
//             }
//             if (nth != 1)
//                 selector += ":nth-of-type("+nth+")";
//         }
//         path.unshift(selector);
//         el = el.parentNode;
//     }
//     return path.join(" > ");
// }
// document.addEventListener('DOMContentLoaded', function(){
//     document.querySelectorAll('input').forEach(el => {
//         if(el.type != 'file'){
//             if(localStorage.getItem(window.location.pathname + ' ' + cssPath(el)) != '' && typeof localStorage.getItem(window.location.pathname + ' ' + cssPath(el)) !== "undefined" && localStorage.getItem(window.location.pathname + ' ' + cssPath(el)))
//                 el.value = localStorage.getItem(window.location.pathname + ' ' + cssPath(el));
//             function saveEdits(){
//                 localStorage.setItem(window.location.pathname + ' ' + cssPath(el), el.value);
//             }
//             el.addEventListener('change', saveEdits);
//             el.addEventListener('keyup', saveEdits);
//             el.addEventListener('keydown', saveEdits);
//             el.addEventListener('input', saveEdits);
//             if(el.form){
//                 el.form.addEventListener('submit', function(){
//                     el.form.querySelectorAll('input').forEach(ele => {
//                         localStorage.removeItem(window.location.pathname + ' ' + cssPath(ele));
//                     });
//                 });
//             }
//         }
//     });
// });
