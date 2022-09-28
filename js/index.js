function search(){
    let filter, a, i, txtValue;
    let input = document.getElementById("search");
    filter = input.value.toUpperCase();
    recents = document.getElementById("your_files");
    file = recents.getElementsByTagName("a");
    for(i = 0; i < file.length; i++){
        a = file[i];
        txtValue = a.textContent || a.innerText;
        if(txtValue.toUpperCase().indexOf(filter) > -1){
            file[i].style.display = "";
        }else{
            file[i].style.display = "none";
        }
    }
    recents = document.getElementById("public_files");
    file = recents.getElementsByTagName("a");
    for(i = 0; i < file.length; i++){
        a = file[i];
        txtValue = a.textContent || a.innerText;
        if(txtValue.toUpperCase().indexOf(filter) > -1)
            file[i].style.display = "";
        else
            file[i].style.display = "none";
    }
    recents = document.getElementById("trash");
    file = recents.getElementsByTagName("a");
    for(i = 0; i < file.length; i++){
        a = file[i];
        txtValue = a.textContent || a.innerText;
        if(txtValue.toUpperCase().indexOf(filter) > -1)
            file[i].style.display = "";
        else
            file[i].style.display = "none";
    }
}