codes = []

function baseFive(size) {
    let vocals = ["A","E","I","O","U"]
    let digits = Math.max(3, size)
    let number = []
    for (let i = 0; i < digits; i++) {
        number.push( vocals[ Math.floor( Math.random() * 5 ) ] )
    }
    return number.join('')
}

function codeGenerator(codes) {
    
    let size = codes.length.toString().length
    let newCode
    do {
        newCode = baseFive(size)
        size++
    } while (codes.includes(newCode))

    return newCode
}

for (let i = 0; i < 10000; i++) {
    codes.push(codeGenerator(codes))
    //console.log(i)
}


console.log(codes[0]) // here I log a few to see the result
console.log(codes[1])
console.log(codes[2])
console.log(codes[3])
console.log(codes[4])
console.log(codes[5])
console.log(codes[6])
console.log(codes[1000])

let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index) // this... well, this checks for
                                                                                    // duplicate codes
console.log(findDuplicates(codes)) //and here I print the duplicates, if any












/*
var codes = []

function codeGenerator() {

    // In case the number is higher than 999, we grab how long it is
    // and adjust the limit acordingly
    let size = codes.length.toString().length
    let substraction = 999
    
    if (size > 3) {
        for (let i = 3; i < size; i++) {
            substraction = (substraction * 10) + 9 //this part adds 9's, so it goes from 999 to 9999
        }
    }

    let newCodeN = Date.now() % substraction
    let digits
    let newCode
    do {
        newCodeN++;
        digits = newCodeN.toString().split('').map(Number)
        newCode = digits.map((digit) => String.fromCharCode(65 + digit)).join("")
    } while (codes.includes(newCode))

    return newCode
}

for (let i = 0; i < 1001; i++) {
    codes.push(codeGenerator())
}

console.log(codes[0]) // here I log a few to see the result
console.log(codes[100])
console.log(codes[1000])

let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index) // this... well, this checks for
                                                                                    // duplicate codes
console.log(findDuplicates(codes)) //and here I print the duplicates, if any

*/















/*
function codeGenerator(number) {

    // In case the number is higher than 999, we grab how long it is
    // and adjust the limit acordingly
    let size = number.toString().length
    let substraction = 999
    
    if (size > 3) {
        for (let i = 3; i < size; i++) {
            substraction = (substraction * 10) + 9 //this part adds 9's, so it goes from 999 to 9999
        }
    }
    

    // This equation has the form Y = mX + b, the equation of a straight line
    // It maps the value so the result looks like a random number
    let m = 34
    let b = 1000
    
    let code = (m * (number + 1)) + b


    // Now, if the result is higher than 999 (higher than a 3 digit number),
    // the number gets reduced by 999, effectively clamping the result inside the limit
    while (code > substraction) {
        code -= substraction
    }
    
    // Finally, the digits are collected into an array...
    let digits = []
    size = Math.max(3, size) // Usually we want a 3 digit code, but we can go higher if the number is over 999
    for (i = 0; i < size; i++) {
        // The modulus operator takes the least significant digit and pushes it into the array
        digits.push(code % 10)
        // Then the code gets divided by ten to get the next digit on the next iteration
        code = Math.floor(code / 10)
    }
    
    // .map() turns an array into another array, depending on the function inside
    // In this case, it grabs the digit and turns it into a letter by adding the ASCII value of 'A'
    // then it uses the String method .fromCharCode() to turn the number into a character
    // Finally, it grab all the letters from the array and .join()'s them into a single string
    return digits.map((digit) => String.fromCharCode(65 + digit)).join("")
}

let codes = []

for (let i = 1; i < 300000; i++) {  //let's generate 300,000 codes
    codes[i] = codeGenerator(i)
}

console.log(codes[0]) // here I log a few to see the result
console.log(codes[1])
console.log(codes[2])
console.log(codes[3])


let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index) // this... well, this checks for
                                                                                    // duplicate codes
console.log(findDuplicates(codes)) //and here I print the duplicates, if any

*/
