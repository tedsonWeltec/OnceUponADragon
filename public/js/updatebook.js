var selectedPage = 0
var pages = [[]] // First array: Pages. Second array: Different player's input per page.
var currentPage = ""
var newPage = []



const viewBook = function () {
    const bookData = JSON.parse($("#saveFormInput").val())
    pages = bookData.pages;
    pages.forEach((page, i) => {
        pages[i] = JSON.parse(pages[i])
    })

    currentPage = pages[selectedPage].reduce((previousLine, currentLine) => {
        return previousLine + currentLine.player + ": " + currentLine.text.replace(/\*linebreak\*/g,"\n") + "\n"
    }, "")
    
    $("#pageInput").val(currentPage)
    M.textareaAutoResize($('#pageInput'));

    if (selectedPage == (pages.length - 1)) {
        $("#btnNextPage").addClass("disabled")
    } else {
        $("#btnNextPage").removeClass("disabled")
    }
    if (selectedPage == 0) {
        $("#btnPreviousPage").addClass("disabled")
    } else {
        $("#btnPreviousPage").removeClass("disabled")
    }
}

$(document).ready(function () {
    
    viewBook()

    $("#btnNextPage").click(() => {
        selectedPage += 1
        viewBook()
        if ($("#sounds").text() == "true") { new Audio('/sfx/Book flip.mp3').play() }
    })
    $("#btnPreviousPage").click(() => {
        selectedPage -= 1
        viewBook()
        if ($("#sounds").text() == "true") { new Audio('/sfx/Book flip.mp3').play() }
    })
    $("#btnFinishEditing").click(function () {
        $("#saveForm").submit()
    })


    $("#pageInput").keyup(function () {
        let tempPage = $("#pageInput").val().split('\n')
        tempPage.pop()
        
        tempPage.forEach((line, i) => {
            tempPage[i] = tempPage[i].split(': ')
            tempPage[i] = { player: tempPage[i][0], text: tempPage[i][1]}
        })

        console.log(tempPage)
        newPage = tempPage
        let bookData = JSON.parse($("#saveFormInput").val())
        bookData.pages[selectedPage] = JSON.stringify(newPage)
        $("#saveFormInput").val(JSON.stringify(bookData))
    })

})
