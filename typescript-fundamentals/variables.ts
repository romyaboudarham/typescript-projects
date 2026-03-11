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

// Declaring Arrays
let listOptn1: number[] = [1,2,3];
let listOptn2: Array<number> = [1,2,3];

// Enum
// a type that allows you to define a set of named constants
// makes code more readable and maintainable by providing a clear and consise way
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
            "name" in obj // checks weather object has name property
}

if (hasName(unknownVar)) {
    console.log(unknownVar.name);
}

// This is how you safely handle things like:
// API responses, JSON data, form input, unknown external data

// Type Inference
let b = 20; // type inference typed this as a number
let a; // type inference doesn't work when there's no initialization
a = 10;
a = true;

// Type Unions
// used when a value is not in our control (user inputs, api, library)
let multiType: boolean | number; // has more restrictions than any nad has intellisense support
multiType = true;
multiType = 20;

// Object Types
let person: { name: string; age: number } = {
    name: "Romy",
    age: 25,
};

// Optional properties use ?
let config: { host: string; port?: number } = {
    host: "localhost",
    // port is optional, so this is valid
};

// Type Aliases
// reusable type definition
type Point = { x: number; y: number };
let origin: Point = { x: 0, y: 0 };

// Tuple
// an array with a fixed number of elements of specific types
let coordinate: [number, number] = [40.7128, -74.006];
let entry: [string, number] = ["age", 25];

// Type Assertions
// tell the compiler to treat a value as a specific type
let input = document.getElementById("username") as HTMLInputElement;
// input.value is now available

// Readonly
// prevents reassignment of properties
let readonlyPoint: Readonly<Point> = { x: 1, y: 2 };
// not allowed: readonlyPoint.x = 5;

// Record type
// an object type with specific key and value types
let scores: Record<string, number> = {
    alice: 95,
    bob: 87,
};
