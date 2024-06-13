let reactions_added = [];
fetch('https://api2.starfiles.co/reactions?website=' + document.starfilesreact.domain + '&placement_id=' + document.starfilesreact.id, {
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
})
.then(response => response.json())
.then(data => {
    data.forEach(reaction => addReaction(reaction));
    document.starfilesreact.reactions.forEach(reaction => addReaction({"reaction":reaction,"count":"0"}));
    function addReaction(reaction){
        // Check if reaction is already added
        if(reactions_added.includes(reaction['reaction']))
            return false;
        reactions_added.push(reaction['reaction']);

        // Add reaction
        let el = document.createElement('reactionoption');
        el.innerHTML = reaction.reaction + '<span class="reactionCount">' + reaction.count + '</span>';
        el.style.userSelect = 'none';
        el.setAttribute('data-reaction', reaction.reaction);
        
        // Handle clicks
        el.addEventListener('click', function(){
            // React
            el.getElementsByClassName('reactionCount')[0].innerHTML = parseInt(el.getElementsByClassName('reactionCount')[0].innerHTML,10) + 1;
            fetch('https://api2.starfiles.co/react?website=' + document.starfilesreact.domain + '&placement_id=' + document.starfilesreact.id + '&reaction=' + reaction.reaction, {
                method: 'POST',
                mode: 'no-cors',
                headers: {'Content-Type': 'application/json'}
            });
        });
        document.getElementById('starfilesreact').appendChild(el);
    }
});
// Style
let style = document.createElement('style');
let css = `#starfilesreact{font-family:'Roboto',sans-serif}
reactionoption{background:#eaeaea;padding:2px 8px;border-radius:14px;margin:2px;border-width:2px;border-style:solid;border-color:#eaeaea;display:inline-block}
.reactionCount {padding-left:4px;color:#000000c7}`;
style.appendChild(document.createTextNode(css));
document.getElementsByTagName('head')[0].appendChild(style);

// Font
let roboto = document.createElement('link');
roboto.href = 'https://fonts.googleapis.com/css2?family=Roboto&display=swap';
roboto.rel = 'stylesheet';
document.getElementsByTagName('head')[0].appendChild(roboto);
