const onSubmit = (data) => {
    alert(data);
};
function mirrorChosen(){
    window.location.href = document.getElementById("mirrors").value;
}
function openFullscreen(){
    elem = document.getElementsByClassName('fullscreen_item')[0];
    if(elem.requestFullscreen)
        elem.requestFullscreen();
    else if(elem.webkitRequestFullscreen)
        elem.webkitRequestFullscreen();
    else if(elem.msRequestFullscreen)
        elem.msRequestFullscreen();
    else{
        let fullscreen = true;
        elem.style.position = 'absolute';
        elem.style.width='100vw';
        elem.style.height='100vh';
        elem.style.maxWidth='100vw';
        elem.style.maxHeight='100vh';
        elem.style.top='0';
        elem.style.left='0';

        let btn = document.createElement('button');
        btn.innerHTML = 'Exit Fullscreen';
        btn.style.position = 'absolute';
        btn.style.left = '0';
        btn.style.bottom = '0';
        btn.style.width = '100%';
        btn.style.zIndex = '1';
        btn.classList.add('btn');
        btn.addEventListener('click', function(){
            let fullscreen = false;
            elem.style.display = 'none';
            btn.style.display = 'none';
        });
        document.body.appendChild(btn);
        window.addEventListener('scroll', function(){
            if(fullscreen)
                window.scrollTo(0, 0);
        });
    }
}
new ClipboardJS('.clipboardjs');
