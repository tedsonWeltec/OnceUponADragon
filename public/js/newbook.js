var players = []
var selectedThemes = []
var selectedPlayer = 1
var selectedPage = 0
const fac = new FastAverageColor()
const characters = []
const backgrounds = []
const prompts = {}
const maxCharacters = 80

var character1 = ""
var character2 = ""
var character3 = ""
var currentBackground = ""

var pages = [[]] // First array: Pages. Second array: Different player's input per page.
var currentPage = ""
var currentPlayerColorCircle = ""

var showNames = true


const initializeNewBook = function() {

    // *********************** Name and avatar selection ***********************

    // When clicking the change avatar icon, save what position was clicked
    $(".playerModalTrigger").click(function() { selectedPlayer = this.id })

    // When choosing a color, change the circle next to the player's name
    $(".colorSelector").click(function() {
        const keepClasses =  ["tooltipped", "modal-trigger", "btn", "btn-floating", "darken-3"]
        const classList = $("#"+selectedPlayer).prop("classList")
        classList.forEach(classElment => {
            if (keepClasses.includes(classElment)) { return 0; }
            $("#"+selectedPlayer).removeClass(classElment)
        })
        $("#"+selectedPlayer)
            .addClass(this.value)
            .attr("data-color",this.value)
    })

    // Prevent weird characters from being typed in the player name input
    $(".validate").keydown(function(e) {
        const regex = RegExp('[0-9a-zA-Z\\s]');
        if (!regex.test(e.key) && e.key != 'backspace') {
            e.preventDefault();
        }
    })

    $("#btnSelectThemes").click(function () {
        
        // Populate the player list
        for (let i = 1; i <= 10; i++) {
            if ($("#player"+i).val() != "") {
                const player = {
                    name: $("#player"+i).val(),
                    color: $("#color"+i).attr("data-color")
                }
                players.push(player)
            }
        }
        // If there are no players, don't do anything
        if (players.length == 0) { alert("There must be at least one player."); return; }
        selectedPlayer = 1

        $("#playersDialog").addClass("fadeOutDone")
        setTimeout(() => {
            $("#playersDialog").addClass("hide")
            $("#themesDialog").removeClass("hide")
        }, 1000);
        setTimeout(() => {
            $("#themesDialog").addClass("fadeOut").removeClass("fadeIn")
        }, 1250);
        
        if ($("#sounds").text() == "true") { new Audio('/sfx/Transition.mp3').play() }
    })
    
    $(".themeSelector").click(function () {
        
        if ($(this).hasClass("themeSelected")) {
            $(this).removeClass("themeSelected")
            $("#"+$(this).attr("id")+"Card")
            .removeClass("light-green")
            .addClass("green")
            .addClass("darken-3")
        } else {
            $(this).addClass("themeSelected")
            $("#"+$(this).attr("id")+"Card")
            .addClass("light-green")
            .removeClass("green")
            .removeClass("darken-3")
        }
    })
    
    // *********************** Pressing the start button ***********************
    $("#btnStart").click(function() {
        
        $(".themeSelector").each(function() {
            if ($(this).hasClass("themeSelected")) {
                selectedThemes.push($(this).attr("id"))
            }
        })
        if (selectedThemes.length == 0) { alert("There must be at least one theme selected."); return 0; }

        let randomEnding = prompts["Ending"][Math.floor(Math.random()*prompts["Ending"].length)]
        $("#endingPrompt").html(randomEnding)
        $("#btnChangeEnding").click(function () {
            let randomEnding = prompts["Ending"][Math.floor(Math.random()*prompts["Ending"].length)]
            $("#endingPrompt").html(randomEnding)
        })
        
        // Animation effect to transition between the player name's input and the book creation
        $("#themesDialog").addClass("fadeOutDone")
        $("#nameBanner").addClass("fadeOutDone")
        setTimeout(() => {
            // Fade the player name's input out
            $("#themesDialog").addClass("hide")
            $("#nameBanner").addClass("hide")
            $("#bookCreation").removeClass("hide")
        }, 1000)
        setTimeout(() => {

            // Populate the players list in the book creation
            players.forEach((player, i) => {
                let first = ""
                if (i == 0){ first = "active" }
                $("#playerList").append(

`<li id=${player.name.replace(/ /g, "")} class="collection-item sizeOneFiveSpan valign-wrapper ${first}">
    <a class="btn-floating center-align sizeTwoSpan ${player.color} darken-3">${player.name[0].toUpperCase()}</a>
    &nbsp;${player.name}
</li>`

                )
            })
            
            // Display the book creation
            $("#bookCreation")
                .addClass("fadeInDone")
                .removeClass("fadeIn")

            $("#btnNextPage").attr("disabled", true)
            $("#btnFinishBook").attr("disabled", true)
        }, 1250)

        // Set the textarea max character length
        $("#pageInput")
            .attr("data-length", maxCharacters)
            .attr("maxLength", maxCharacters)

        if ($("#sounds").text() == "true") { new Audio('/sfx/Transition.mp3').play() }
    })
    //

    // *********************** Book creation logic ***********************

    // When typing on the input text during book creation, change the text on the page
    // Also, check for keywords and populate the background and characters
    $("#pageInput").keyup(function() {
        
        
        // Save the entered text in the variable 'input'
        let input = this.value
        // Create the player's color circle with their initial
        let playerColorCircle = 
`<a class="btn-floating center-align sizeTwoSpan ${players[selectedPlayer-1].color} darken-3 tooltipped"
    data-position="bottom" data-tooltip="${players[selectedPlayer-1].name}"
    style="font-family: -apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Oxygen-Sans,Ubuntu,Cantarell,&quot;Helvetica Neue&quot;,sans-serif;">
        ${players[selectedPlayer-1].name[0].toUpperCase()}
</a> `



        // If the player hasn't typed anything, disable the next page button and don't show the player circle
        $("#btnNextPage").attr("disabled", ( input == "" && pages[pages.length-1].length == 0 ) )
        if (input == "") { playerColorCircle = "" }

        // Check if we have more text from previous players on the page
        const previousText = pages[pages.length-1].reduce((text, page) => text + page.playerCircle + page.text + "\n", "")
        const previousInput = pages[pages.length-1].reduce((text, page) => text + page.text + " ", "")

        // Show it on the book's page
        $("#pageText").html(previousText + playerColorCircle + input.replace(/\n/g, "<br />"))
        $('.tooltipped').tooltip({exitDelay: 0})

        currentPlayerColorCircle = playerColorCircle;
        currentPage = input;
        input = previousInput + input;

        // Change non-word characters into spaces to get the words only for the tag count
        const symbols = new RegExp(/(\W+|_+)/,"g")
        input = input.toLowerCase().replace(symbols," ").split(" ")
        

        // Count the number of times a certain picture gets tagged
        const newBackground = countTags(backgrounds, input)
        if (newBackground == "") { currentBackground = "default"}
        if (newBackground != "" && newBackground != currentBackground) {
            currentBackground = newBackground
            $("#pageBackground").attr("src", currentBackground)
            updateTextColor()




            let tempTags = currentBackground.split("/")[2].split(".")[0].split(" ")
            tempTags.forEach(tag => {
                if (tag.substr(0,2) == "c(") {
                    let margins = tag.split("(")[1].split(")")[0].split(",")
                    $("#pageText")
                        .css("right", margins[0]+"%")
                        .css("top", margins[1]+"%")
                        .css("left", margins[2]+"%")
                }  
            })
        }

        
        // Sweep and find the best suited character
        // Remove the suited character's tags from all characters
        // Sweep again!
        const newCharacter1 = countTags(characters, input)
        if (newCharacter1 != character1) {
            character1 = newCharacter1
            $("#character1").attr("src", character1)
        }
        
        const newCharacter2 = countTags(characters, input, [character1])
        if (newCharacter2 != character2) {
            character2 = newCharacter2
            $("#character2").attr("src", character2)
        }

        const newCharacter3 = countTags(characters, input, [character1, character2])
        if (newCharacter3 != character3) {
            character3 = newCharacter3
            $("#character3").attr("src", character3)
        }
    })

    $("#btnNextPlayer").click(function() {

        addInputToPage()

        // Calculate the current page character's length
        const pageLength = pages[pages.length-1].reduce( (length, page) => length + page.text.length, 0 )
        console.log(pageLength)
        clearTextarea(pageLength)

        selectNextPlayer()

        // Play a bell sound
        if ($("#sounds").text() == "true") { new Audio('/sfx/Pleasing bell.mp3').play() }

        tempSaveBook()
    })

    $("#btnNextPage").click(function () {
        $("#btnNextPage").attr("disabled", true)
        
        // Prevent adding a blank page, players have to type something
        if (!addInputToPage()) { return 0; }
        

        // Create a new empty page on the pages array
        pages.push([])

        
        
        clearTextarea()

        selectNextPlayer()

        // Clear the current page to be displayed on the book
        currentPage = ""
        $("#pageText").html("")
        $("#character1").attr("src", "")
        $("#character2").attr("src", "")
        $("#character3").attr("src", "")

        //Play a book flip audio
        if ($("#sounds").text() == "true") { new Audio('/sfx/Book flip.mp3').play() }

        tempSaveBook()
    })

    $("#btnFinishBook").click(function () {

        addInputToPage()
        
        //Play a book flip audio
        if ($("#sounds").text() == "true") { new Audio('/sfx/Book flip.mp3').play() }


        $("#bookCreation")
            .removeClass("fadeInDone")
            .addClass("fadeIn")
        
        $("#bookFinish").addClass("fadeOutDone")
        
        setTimeout(() => {
            $("#bookCreation").addClass("hide")
            $("#bookFinish").removeClass("hide")
        }, 1000)
        setTimeout(() => {
            $("#bookFinish").addClass("fadeInDone")
        }, 1250)

        tempSaveBook()

        currentBackground = $("#bookCoverImage").attr("src")

    })
    
    $("#bookTitleInput").keyup(function() {
        let input = this.value
        $("#bookTitleDisplay").html(input)
        const symbols = new RegExp(/(\W+|_+)/,"g")
        input = input.toLowerCase().replace(symbols," ").split(" ")
        
        // ????????????????????????????????????????????????????????????????????????????????????????
        // Ask the client if they want dynamic book covers or not

        const newBackground = countTags(backgrounds, input)
        if (newBackground != "") {
            currentBackground = newBackground
            $("#bookCoverImage").attr("src", currentBackground)
        }
        
        // Sweep and find the best suited character
        // Remove the suited character's tags from all characters
        // Sweep again!
        const newCharacter1 = countTags(characters, input)
        if (newCharacter1 != character1) {
            character1 = newCharacter1
            $("#characterCover1").attr("src", character1)
        }
        
        const newCharacter2 = countTags(characters, input, [character1])
        if (newCharacter2 != character2) {
            character2 = newCharacter2
            $("#characterCover2").attr("src", character2)
        }

        const newCharacter3 = countTags(characters, input, [character1, character2])
        if (newCharacter3 != character3) {
            character3 = newCharacter3
            $("#characterCover3").attr("src", character3)
        }



    })


    $("#btnSaveBook").click(function () {
        pages.forEach(page => page.forEach(line => {
            delete line.playerCircle
        }))
        let book = {
            title: $("#bookTitleInput").val(),
            players: players,
            pages: pages,
            cover: {
                background: currentBackground,
                character1: character1,
                character2: character2,
                character3: character3
            }
        }
        book = JSON.stringify(book)
        $("#saveFormInput2").val(book)
        $("#saveForm2").submit()
    })

    $("#btnPrompts").click(function () {
        let randomPlace = prompts["Place"][Math.floor(Math.random()*prompts["Place"].length)]
        let randomThing = prompts["Thing"][Math.floor(Math.random()*prompts["Thing"].length)]
        let randomEvent = prompts["Event"][Math.floor(Math.random()*prompts["Event"].length)]
        let randomChara = prompts["Character"][Math.floor(Math.random()*prompts["Character"].length)]
        
        let random = Math.floor(Math.random() * 4)
        
        let text = "Write about "
        if (random == 0) {
            text += randomChara
        }
        if (random == 1) {
            text += randomPlace
        }
        if (random == 2) {
            text += randomThing
        }
        if (random == 3) {
            text += randomEvent
        }

        $("#promptText").text(text)
    })
    
    function tempSaveBook() {
        let pages2 = JSON.parse(JSON.stringify(pages))
        pages2.forEach(page => page.forEach(line => {
            delete line.playerCircle
            line.text = line.text.replace(/<br \/>/g,"*linebreak*")
        }))
        let book = {
            title: "Unfinished book (pick to continue)",
            players: players,
            themes: selectedThemes.toString(),
            pages: pages2,
            cover: {
                background: "imgs/backgrounds/default.jpg",
                character1: "",
                character2: "",
                character3: ""
            }
        }
        book = JSON.stringify(book)
        $("#saveFormInput").val(book)
        $("#saveForm").submit()
    }
    
    // Save the current input into the pages array (along with the player's color circle)
    function addInputToPage(){
        if (currentPage == "") { return false; }
        $("#btnFinishBook").attr("disabled", false)
        pages[pages.length-1].push(
            {
                playerCircle: currentPlayerColorCircle,
                player: players[selectedPlayer-1].name,
                text: currentPage.replace(/\n/g, "<br />")
            }
        )
        currentPage = ""
        return true;
    }

    // Clear the page input text area and update the max character limits
    function clearTextarea (pageLength = 0) {
        if (pageLength < 0) { pageLength = 0 }
        $("#pageInput")
        .val("")
        .attr("data-length", maxCharacters - pageLength)
        .attr("maxLength", maxCharacters - pageLength)
        .focus()
    }

    // Select next player (remove current player's active class and give it to the next one)
    function selectNextPlayer () {
        $("#"+players[selectedPlayer-1].name.replace(/ /g, "")).removeClass("active")
        selectedPlayer++;
        if (selectedPlayer > players.length) { selectedPlayer = 1 }
        $("#"+players[selectedPlayer-1].name.replace(/ /g, "")).addClass("active")
    }



    
    
}





const viewBook = function () {
    const bookData = JSON.parse($("#bookData").text())
    const userData = $("#userData").text()
    players = bookData.players;
    
    selectedThemes = bookData.themes;
    pages = bookData.pages;
    pages.push(JSON.stringify([{player: "Credits", text: 
`Credits:*linebreak*
*linebreak*
Story Leader: ${bookData.authorName+userData}*linebreak*
Players:
${bookData.players.map(player => JSON.parse(player).name).join(', ')}`
}]))
    players.push(JSON.stringify({ name: "Credits", color: "red" }))
    players.forEach((player, i) => {
        players[i] = JSON.parse(players[i])
        players[i].ColorCircle = 
`<a class="btn-floating center-align sizeTwoSpan ${players[i].color} darken-3 tooltipped"
    data-position="bottom" data-tooltip="${players[i].name}"
    style="font-family: -apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Oxygen-Sans,Ubuntu,Cantarell,&quot;Helvetica Neue&quot;,sans-serif;">
    ${players[i].name[0].toUpperCase()}
</a> `
    })
    pages.forEach((page, i) => {
        pages[i] = JSON.parse(pages[i])
    })


    currentPage = pages[selectedPage].reduce((previousLine, currentLine) => {
        return previousLine + " " +
               (showNames ? players.find(player => currentLine.player == player.name).ColorCircle : "") +
               currentLine.text.replace(/\*linebreak\*/g,"<br />")
    }, "")
    let input = pages[selectedPage].reduce((previousLine, currentLine) => {
        return previousLine + " " + currentLine.text
    }, "")

    $("#pageText").html(currentPage)
    $('.tooltipped').tooltip({exitDelay: 0})

    // Change non-word characters into spaces to get the words only for the tag count
    const symbols = new RegExp(/(\W+|_+)/,"g")
    input = input.toLowerCase().replace(symbols," ").split(" ")

    const newBackground = countTags(backgrounds, input)
    if (newBackground != "" && newBackground != currentBackground) {
        currentBackground = newBackground
        $("#pageBackground").attr("src", currentBackground)
        updateTextColor()




        let tempTags = currentBackground.split("/")[2].split(".")[0].split(" ")
        tempTags.forEach(tag => {
            if (tag.substr(0,2) == "c(") {
                let margins = tag.split("(")[1].split(")")[0].split(",")
                $("#pageText")
                    .css("right", margins[0]+"%")
                    .css("top", margins[1]+"%")
                    .css("left", margins[2]+"%")
            }  
        })
    }


    const newCharacter1 = countTags(characters, input)
    if (newCharacter1 != character1) {
        character1 = newCharacter1
        $("#character1").attr("src", character1)
    }
    
    const newCharacter2 = countTags(characters, input, [character1])
    if (newCharacter2 != character2) {
        character2 = newCharacter2
        $("#character2").attr("src", character2)
    }

    const newCharacter3 = countTags(characters, input, [character1, character2])
    if (newCharacter3 != character3) {
        character3 = newCharacter3
        $("#character3").attr("src", character3)
    }

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

    // Get the characters and backgrounds information from the page (which got it from the server)
    $(".characterData").each(function () {
        characters.push("imgs/characters/"+$(this).text())
    })
    $(".backgroundData").each(function() {
        backgrounds.push("imgs/backgrounds/"+$(this).text())
    })
    currentBackground = $("#pageBackground").attr("src")
    $(".promptData").each(function() {
        let value = $(this).text().trim().split("	")
        let name = value[0]
        let category = value[1]
        if (prompts[category] == undefined) { prompts[category] = [] }
        prompts[category].push(name)
    })

    if ($("#bookType").text() == "creation") {
        initializeNewBook()
        $("#pageInput").focus()
    }
    if ($("#bookType").text() == "view") {
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

        $("#btnHideNames").click(() => {
            showNames = !showNames
            viewBook()
        })
    }
})

// Get the color of the page background to decide between a black or white font
// (and also the color of the stroke outline)
function updateTextColor () {
    fac.getColorAsync($("#pageBackground").get(0))
    .then(function(color) {
        const shadow = `0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex},0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex},0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex},0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}, 0 0 3px ${color.hex}`
        $("#pageText")
            .css("textShadow", shadow)
            .css("color", color.isDark ? '#fff' : '#000')
    })
    .catch(function(e) {
        console.log(e);
    });
}

function countTags(collection, input, usedCharacters = []) {
    // Set up variables
    let tagsCount = {}
    let usedTags = []
    //Check if we used a character already, removing their tags to prevent duplicates (gir and girl crying, for example)
    usedCharacters.forEach(usedChar => {
        if (usedChar == "") { return 0; }
        //This is just removing the "/img/backgrounds/" and the extension (.jpg, .png, etc)
        const usedCharTags = usedChar.split("/")[2].split(".")[0].split(" ")
        //Skipping the theme tag...
        usedCharTags.forEach((tag, i) => {
            if (selectedThemes.includes(tag)) {
                usedCharTags.splice(i, 1)
            }
        })
        usedTags = usedTags.concat(usedCharTags)
    })
    input = input.concat(selectedThemes)

    // Cycle trough the collection (backgrounds or characters) and find all the tags
    // Comparing them with the input and counting them, keeping the count on tagsCount
    collection.forEach(item => {
        // If we used a character already, skip
        if (usedCharacters.includes(item)) { return 0; }
        //This is just removing the "/img/backgrounds/" and the extension (.jpg, .png, etc)
        const collectionTags = item.split("/")[2].split(".")[0].split(" ")
        tagsCount[item] = 0
        // If the input has the tag and we haven't used that tag yet, increase that tag's count
        collectionTags.forEach(tag => {
            if (tag.substr(0,2) == "c(") { return 0; }
            if (input.includes(tag) && !usedTags.includes(tag)) {
                tagsCount[item]++
            }
        })
    })

    // Which tag has the most results from the input?
    // For example:
    // Input: girl crying   Picture 1: girl (1)     Picture 2: girl crying (2)
    // We select the picture 2 because it has more tags matching the input
    let maxCount = 1
    let selectedItem = ""
    Object.keys(tagsCount).forEach(item => {
        if (tagsCount[item] > maxCount) {
            maxCount = tagsCount[item]
            selectedItem = item
        }
    })
    
    return selectedItem
}
