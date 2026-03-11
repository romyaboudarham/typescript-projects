"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Basic function with typed parameters and return type
function add(num1, num2) {
    return num1 + num2;
}
function fullName(person) {
    console.log("".concat(person.firstName, " ").concat(person.lastName));
}
var p = {
    firstName: "Romy",
};
fullName(p);
// Optional parameter with ?
function greet(name, greeting) {
    return "".concat(greeting !== null && greeting !== void 0 ? greeting : "Hello", ", ").concat(name, "!");
}
// Default parameter
function multiply(a, b) {
    if (b === void 0) { b = 2; }
    return a * b;
}
// Rest parameters
// collects remaining arguments into a typed array
function sum() {
    var numbers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        numbers[_i] = arguments[_i];
    }
    return numbers.reduce(function (total, n) { return total + n; }, 0);
}
// Arrow function
var square = function (x) { return x * x; };
var divide = function (a, b) { return a / b; };
// void return type: function performs an action but returns nothing
function logMessage(message) {
    console.log(message);
}
// never return type: function never returns (throws or runs forever)
function throwError(message) {
    throw new Error(message);
}
function format(value) {
    return String(value).trim();
}
