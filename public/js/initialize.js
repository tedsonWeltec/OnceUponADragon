
//Materialize element's initialization section.
$(document).ready(function(){
    $('.sidenav').sidenav()
    $('.tooltipped').tooltip({exitDelay: 0})
    $('.modal').modal()
    $('textarea').characterCounter()
})