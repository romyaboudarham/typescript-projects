// typescript file gets transpiled to javascript file
export {}

let message = "Welcome back";
console.log(message);

// Javascript has global and function scoping using "var"
// Typescript adds "let" and "const" which adds block scoping

// use let when: variable needs to be reassigned
// use const when: a variable NEVER needs to be reassigned a value

let x; // allowed: doesn't need to be initialized
const y = 20; // needs to be initialize. not allowed: let const y;

// Javascript allows multiple variables to exist with the same name
// this is an error in Typescript
// let x = 20;

// Variable Types:
// Point 1: Static type checking to avoid mistakes that go unnoticed during developement
// Point 2: Intellisense: provide properties and methods applicable to the respective variable type
let isBool: boolean = true;
let total: number;
let firstName: string = "Romy";
let lastName: string = "Aboudarham";
let sentence: string = `My name is ${firstName}
My last name is ${lastName}`;
console.log(sentence);

// when strictNullChecks, null and undefined are treated as separate types. 
// They are not automatically allowed as subtypes
let age: number | null = null; // allowed
// not allowed: let age: number = null;

// Decalring Arrays
let listOptn1: number[] = [1,2,3];
let listOptn2: Array<number> = [1,2,3];

// Enum
// a type that allows you to define a set of named constants
// makes code more readable and maintainable by provide a clear and consise way
// to represent a set of related, fixed values, such as user roles, status codes, or directions
enum Direction {
    Up, // default set to 0
    Down, // 1
    Left, // 2
    Right // 3
} 

let currentDirection: Direction = Direction.Up;
console.log(currentDirection); // logs 0

enum UserRole {
    ADMIN = "ADMIN",
    EDITOR = "EDITOR",
    VIEWER = "VIEWER",
}

function checkAccess(role: UserRole): void { // function needs a return type
    if (role === UserRole.ADMIN) {
        console.log("You have full access!")
    }
}

let user1: UserRole = UserRole.ADMIN;
checkAccess(user1);

// any
// disabled type checking for the variable
// most capable type in typescript, good for migrating from js to ts
let anyVar: any = 10;
anyVar = "Romy";
anyVar = false;
// compiles but fails at runtime when:
// anyVar.toUpperCase();

// unknown
// error risks of any
let unknownVar: unknown = "romy";
// not allowed: unknownVar.toUpperCase();
// or use typecast
console.log((unknownVar as string).toUpperCase()); // as <type> is typecasting 


// or use a function to check
// obj is {name: string} - predicate
// if this function returns true, then obj should be treated as {name: string}
function hasName(obj: any): obj is {name: string} {
    return !!obj && // !! Converts the value to a boolean. Protects from: unknownVar = null or 0, "", undefined, false
            typeof obj === "object" && // ensures value is an object: {}, []
            "name" in obj // checks weather 
}

if (hasName(unknownVar)) {
    console.log(unknownVar.name);
}

// This is how you safely handle things like:
// API responses, JSON data, form input, unknown external data

