window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('set', 'user_properties',{
    'user_id': cookie('profile'),
    'theme': cookie('color'),
    'language': cookie('lang'),
    'font': cookie('font'),
    'url': window.location.href,
    'ip_address': cookie('ip_address')
});
gtag('config', cookie('analyticscode'),{
    'link_attribution': true,
    'cookie_prefix': 'ga1_'
});
gtag('config', cookie('analyticscode2'),{
    'link_attribution': true,
    'cookie_prefix': 'ga2_'
});
gtag('config', cookie('analyticscode3'),{
    'link_attribution': true,
    'cookie_prefix': 'ga3_'
});
var stf_code = 'starfiles';
var stf_domain = cookie('domain');
window.addEventListener('load', (event) =>{
    getStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css');
    getScript('https://' + cookie('cdn') + '/js/ethicalads.js');
    getScript('https://api.' + cookie('domain') + '/cache_profile.js');
});
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('https://' + cookie('domain') + '/sw.js',{scope: '/'})
    .then(function(registration){
            /*console.log('Service Worker Registered');*/
    });

    navigator.serviceWorker.ready.then(function(registration){
    /*console.log('Service Worker Ready');*/
    });
}
var domain = cookie('domain');
var cdn = cookie('cdn');
var profile = cookie('profile');
var recentsgridlayout = cookie('recentsgridlayout');
var rightclickhash = cookie('rightclickhash');
var uploadfilehash = cookie('uploadfilehash');
window.addEventListener('load', (event) => {
    getStyle('https://cdnjs.cloudflare.com/ajax/libs/intro.js/3.2.1/introjs.min.css');
    getScript('https://' + cdn + '/js/upload.min.js?' + uploadfilehash);
    getScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js');
    getScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js');
    getScript('https://cdnjs.cloudflare.com/ajax/libs/popper.js/2.6.0/umd/popper.min.js');
    getScript('https://cdnjs.cloudflare.com/ajax/libs/intro.js/3.2.1/intro.min.js');
});