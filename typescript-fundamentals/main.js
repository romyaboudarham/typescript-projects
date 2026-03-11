"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var message = "Welcome back";
console.log(message);
// Javascript has global and function scoping using "var"
// Typescript adds "let" and "const" which adds block scoping
// use let when: variable needs to be reassigned
// use const when: a variable NEVER needs to be reassigned a value
var x; // allowed: doesn't need to be initialized
var y = 20; // needs to be initialize. not allowed: let const y;
// Javascript allows multiple variables to exist with the same name
// this is an error in Typescript
// let x = 20;
// Variable Types:
// Point 1: Static type checking to avoid mistakes that go unnoticed during developement
// Point 2: Intellisense: provide properties and methods applicable to the respective variable type
var isBool = true;
var total;
var firstName = "Romy";
var lastName = "Aboudarham";
var sentence = "My name is ".concat(firstName, "\nMy last name is ").concat(lastName);
console.log(sentence);
// when strictNullChecks, null and undefined are treated as separate types. 
// They are not automatically allowed as subtypes
var age = null; // allowed
// not allowed: let age: number = null;
// Decalring Arrays
var listOptn1 = [1, 2, 3];
var listOptn2 = [1, 2, 3];
// Enum
// a type that allows you to define a set of named constants
// makes code more readable and maintainable by provide a clear and consise way
// to represent a set of related, fixed values, such as user roles, status codes, or directions
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Down"] = 1] = "Down";
    Direction[Direction["Left"] = 2] = "Left";
    Direction[Direction["Right"] = 3] = "Right"; // 3
})(Direction || (Direction = {}));
var currentDirection = Direction.Up;
console.log(currentDirection); // logs 0
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["EDITOR"] = "EDITOR";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (UserRole = {}));
function checkAccess(role) {
    if (role === UserRole.ADMIN) {
        console.log("You have full access!");
    }
}
var user1 = UserRole.ADMIN;
checkAccess(user1);
// any
// disabled type checking for the variable
// most capable type in typescript, good for migrating from js to ts
var anyVar = 10;
anyVar = "Romy";
anyVar = false;
// compiles but fails at runtime when:
// anyVar.toUpperCase();
// unknown
// error risks of any
var unknownVar = "romy";
// not allowed: unknownVar.toUpperCase();
// or use typecast
console.log(unknownVar.toUpperCase()); // as <type> is typecasting 
// or use a function to check
// obj is {name: string} - predicate
// if this function returns true, then obj should be treated as {name: string}
function hasName(obj) {
    return !!obj && // !! Converts the value to a boolean. Protects from: unknownVar = null or 0, "", undefined, false
        typeof obj === "object" && // ensures value is an object: {}, []
        "name" in obj; // checks weather 
}
if (hasName(unknownVar)) {
    console.log(unknownVar.name);
}
// This is how you safely handle things like:
// API responses, JSON data, form input, unknown external data
