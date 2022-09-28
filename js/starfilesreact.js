let reactions_added = [];
fetch('https://api.starfiles.co/react/get_reactions?website=' + document.starfilesreact.domain + '&placement_id=' + document.starfilesreact.id + '&user_id=' + document.starfilesreact.user_id, {
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
})
.then(response => response.json())
.then(data => {
    data.forEach(reaction => addReaction(reaction));
    document.starfilesreact.reactions.forEach(reaction => addReaction({"reaction":reaction,"count":"0","selected":false}));
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
        if(reaction['selected'] && !document.starfilesreact.multiple_reactions)
            el.classList.add('reactionSelected');
        
        // Handle clicks
        el.addEventListener('click', function(){
            function unreact(ele){
                ele.classList.remove('reactionSelected');
                ele.getElementsByClassName('reactionCount')[0].innerHTML = parseInt(ele.getElementsByClassName('reactionCount')[0].innerHTML, 10) - 1;
                fetch('https://api.starfiles.co/react/unreact?website=' + document.starfilesreact.domain + '&placement_id=' + document.starfilesreact.id + '&reaction=' + ele.getAttribute('data-reaction') + '&user_id=' + document.starfilesreact.user_id, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {'Content-Type': 'application/json'}
                });
            }
            if(document.starfilesreact.unique_reactions){
                document.querySelectorAll('.reactionSelected').forEach(box => {
                    console.log(box);
                    unreact(box);
                });
            }
            if(!document.starfilesreact.multiple_reactions && el.classList.contains('reactionSelected'))
                unreact(el);
            else{
                // React
                if(!document.starfilesreact.multiple_reactions)
                    el.classList.add('reactionSelected');
                el.getElementsByClassName('reactionCount')[0].innerHTML = parseInt(el.getElementsByClassName('reactionCount')[0].innerHTML,10) + 1;
                fetch('https://api.starfiles.co/react/react?website=' + document.starfilesreact.domain + '&placement_id=' + document.starfilesreact.id + '&reaction=' + reaction.reaction + '&user_id=' + document.starfilesreact.user_id, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {'Content-Type': 'application/json'}
                });
            }
        });
        document.getElementById('starfilesreact').appendChild(el);
    }
});
// Style
let style = document.createElement('style');
let css = `#starfilesreact{font-family:'Roboto',sans-serif}
reactionoption{background:#eaeaea;padding:2px 8px;border-radius:14px;margin:2px;border-width:2px;border-style:solid;border-color:#eaeaea;display:inline-block}
.reactionCount {padding-left:4px;color:#000000c7}
.reactionSelected{border-color:#9e9e9e}`;
style.appendChild(document.createTextNode(css));
document.getElementsByTagName('head')[0].appendChild(style);

// Font
let roboto = document.createElement('link');
roboto.href = 'https://fonts.googleapis.com/css2?family=Roboto&display=swap';
roboto.rel = 'stylesheet';
document.getElementsByTagName('head')[0].appendChild(roboto);