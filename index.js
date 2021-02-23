function get_files(){
    fetch('https://api.' + cookie('domain') + '/user/folders?profile=' + cookie('profile'))
    .then(function(response){
        fetch('https://api.' + cookie('domain') + '/user/files?profile=' + cookie('profile') + '&sort=' + cookie('sort'))
        .then(function(response){
            fetch('https://api.' + cookie('domain') + '/user/droppers?profile=' + cookie('profile'))
            .then(function(response){
                response.json().then(function(data){
                    data.forEach(function(child, index){
                        if(!element_id_exists('dropper_' + child.id))
                            document.getElementById('droppers').innerHTML += '<a class="banner" id="dropper_' + child.id + '" href="/dropper/' + child.id + '" style="padding: 5px 10px;border-radius: 14px;margin: 5px 2px;display: inline-block;">' + child.id + '</a>';
                    });
                    if(element_id_exists('recents_loading'))
                        document.getElementById('recents_loading').style.display = 'none';
                });
            });
            response.json().then(function(data){
                data.forEach(function(child, index){
                    if(child.star == "1")
                        var starcss = "color:gold;";
                    else
                        var starcss = "";
                    if(!element_id_exists(child.id))
                        document.getElementById('recents').innerHTML += '<a class="rightclick_file" id="' + child.id + '" target="_blank" href="file/' + child.id + '" style="' + starcss + decodeURIComponent(cookie('recentsgridlayout')) + '">' + child.name + '</a>'
                });
            });
        });
        response.json().then(function(data){
            data.forEach(function(child, index){
                if(child.star == "1")
                    var folder_colour = 'gold';
                else
                    var folder_colour = child.colour;
                if(!empty(folder_colour))
                    folder_colour = 'background:' + folder_colour + ';';
                if(child.parent == "" && !element_id_exists('folder_' + child.id))
                    document.getElementById('recents').innerHTML += '<a class="rightclick_folder banner" target="_blank" id="folder_' + child.id + '" href="folder/' + child.id + '" style="' + folder_colour + decodeURIComponent(cookie('recentsgridlayout')) + '">' + child.name + '</a>';
            });
            getScript('https://' + cookie('cdn') + '/js/rightclick.min.js?cache=' + cookie('rightclickhash'));
            // setTimeout(get_files(), 10000);
        });
    });
}
get_files();
window.addEventListener('load', (event) => {
    window.navigator.languages.forEach(language_checker);
    function language_checker(language){
        if(language != 'en' && language != 'en-US' && language != 'en-us' && language != 'en-GB' && language != 'en-gb' && language != 'en-AU' && language != 'en-au'){
            document.getElementById('translation_request_language').innerHTML = language;
            document.getElementById('translation_request_link').href = 'translate/' + language;
            document.getElementById('translation_request').style.display = "block";
        }
    }
    showQrCode('#tooltip_trigger', '#tooltip');
    document.getElementById('widget_one').innerHTML = '<a href="https://trustpilot.com/review/starfiles.ml?utm_medium=trustbox&utm_source=TrustBoxBasic&utm_campaign=free" target="_blank" rel="noopener"><img src="https://' + cookie('cdn') + '/images/trustpilot.svg" alt="Trustpilot" style="max-width:100%;padding:5px" width="180px" height="32px"></a>';
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
        document.getElementById('widget_three').innerHTML = '<a href="https://producthunt.com/posts/starfiles?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-starfiles" target="_blank" rel="noopener"><img src="https://' + cookie('cdn') + '/image?mime=image%2Fsvg%2Bxml&url=api.producthunt.com%2Fwidgets%2Fembed-image%2Fv1%2Ffeatured.svg%3Fpost_id%3D281011%26theme%3Ddark" alt="Starfiles - File hosting done simple | Product Hunt" width="250" height="54"></a>';
        document.getElementById(remotetools_widget).innerHTML = '<a href="https://remote.tools/product/starfiles?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-featured" target="_blank" rel="noopener"><img src="https://' + cookie('cdn') + '/images/remotetoolsdark.svg" alt="Remote Tools" width="250px" height="54px"></a>';
    }else{
        document.getElementById('widget_two').innerHTML = '<a href="https://producthunt.com/posts/starfiles?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-starfiles" target="_blank" rel="noopener"><img src="https://' + cookie('cdn') + '/image?mime=image%2Fsvg%2Bxml&url=api.producthunt.com%2Fwidgets%2Fembed-image%2Fv1%2Ffeatured.svg%3Fpost_id%3D281011%26theme%3Dlight" alt="Starfiles - File hosting done simple | Product Hunt" width="250" height="54"></a>';
        document.getElementById('widget_three').innerHTML = '<a href="https://remote.tools/product/starfiles?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-featured" target="_blank" rel="noopener"><img src="https://' + cookie('cdn') + '/images/remotetoolslight.svg" alt="Remote Tools" width="250px" height="54px"></a>';
    }
    // document.getElementById('widget_four').innerHTML = '<img src="https://' + cookie('cdn') + '/image?mime=image%2Fpng&url=api.thegreenwebfoundation.org/greencheckimage/starfiles.co" alt="This website is hosted Green - checked by thegreenwebfoundation.org">';
    // Carbon Calculator
    const wcID=e=>document.getElementById(e),wcU=encodeURIComponent(window.location.href),newRequest=function(e=!0){fetch("https://api.websitecarbon.com/b?url="+wcU).then((function(e){if(!e.ok)throw Error(e);return e.json()})).then((function(t){e&&renderResult(t),t.t=(new Date).getTime(),localStorage.setItem("wcb_"+wcU,JSON.stringify(t))})).catch((function(e){wcID("wcb_g").innerHTML="No Result",console.log(e),localStorage.removeItem("wcb_"+wcU)}))},renderResult=function(e){wcID("wcb_g").innerHTML=e.c+"g of CO<sub>2</sub>/view",wcID("wcb_2").insertAdjacentHTML("beforeEnd","Cleaner than "+e.p+"% of pages tested")},wcC="<style>#wcb{--b1:#0e11a8;--b2:#00ffbc;font-size:15px;text-align:center;color:var(--b1)}#wcb sub{vertical-align:middle;position:relative;top:.3em;font-size:.7em}#wcb_2,#wcb_a,#wcb_g{display:inline-flex;justify-content:center;align-items:center;text-align:center;font-size:1em;line-height:1.15;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-decoration:none;margin:.2em 0}#wcb_a,#wcb_g{padding:.3em .5em;border:.13em solid var(--b2)}#wcb_g{border-radius:.3em 0 0 .3em;background:#fff;border-right:0;min-width:8.2em}#wcb_a{border-radius:0 .3em .3em 0;border-left:0;background:var(--b1);color:#fff;font-weight:700;border-color:var(--b1)}.wcb-d #wcb_a{color:var(--b1);background:var(--b2);border-color:var(--b2)}.wcb-d #wcb_2{color:#fff}</style>",wcB=wcID("wcb");if("fetch"in window){wcB.insertAdjacentHTML("beforeEnd",wcC),wcB.insertAdjacentHTML("beforeEnd",'<div id="wcb_p"><span id="wcb_g">Measuring CO<sub>2</sub>&hellip;</span><a id="wcb_a" target="_blank" rel="noopener" href="https://websitecarbon.com">Website Carbon</a></div><span id="wcb_2">&nbsp;</span>');let e=localStorage.getItem("wcb_"+wcU);const t=(new Date).getTime();if(e){const n=JSON.parse(e);renderResult(n),t-n.t>864e5&&newRequest(!1)}else newRequest()}
});
