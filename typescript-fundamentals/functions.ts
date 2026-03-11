export {}

// Basic function with typed parameters and return type
function add(num1: number, num2: number): number {
    return num1 + num2;
}

// objects as parameters

// use interface (ex. registration forms)
interface Person {
    firstName: string,
    lastName: string,
}


function fullName(person: Person) {
    console.log(`${person.firstName} ${person.lastName}`);
}

let p = {
    firstName: "Romy",
    lastName: "Aboudarham"
}

fullName(p);

// Optional parameter with ?
function greet(name: string, greeting?: string): string {
    return `${greeting ?? "Hello"}, ${name}!`;
}

// Default parameter
function multiply(a: number, b: number = 2): number {
    return a * b;
}

// Rest parameters
// collects remaining arguments into a typed array
function sum(...numbers: number[]): number {
    return numbers.reduce((total, n) => total + n, 0);
}

// Arrow function
const square = (x: number): number => x * x;

// Function type alias
// describes the shape of a function
type MathOperation = (a: number, b: number) => number;
const divide: MathOperation = (a, b) => a / b;

// void return type: function performs an action but returns nothing
function logMessage(message: string): void {
    console.log(message);
}

// never return type: function never returns (throws or runs forever)
function throwError(message: string): never {
    throw new Error(message);
}

// Overloads
// same function name, different signatures
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
    return String(value).trim();
}


