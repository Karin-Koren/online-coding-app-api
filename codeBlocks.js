const codeBlocks = [
  {
    id: 1,
    name: "Find Maximum Number",
    description:
      "Write a JavaScript program to find the maximum number in an array.",
    initialCode: `
        function findMax(numbers) {
            
        }
    `,
    solution: `function findMax(numbers) {
            if (numbers.length === 0) {
                return undefined;
            }
            let max = numbers[0];
            for (let i = 1; i < numbers.length; i++) {
                if (numbers[i] > max) {
                    max = numbers[i];
                }
            }
            return max;
        }`,
  },
  {
    id: 2,
    name: "Check Prime Number",
    description:
      "Write a JavaScript function to check if a given number is prime.",
    initialCode: `
        function isPrime(number) {
            
        }
    `,
    solution: `function isPrime(number) {
            if (number <= 1) {
                return false;
            }
            for (let i = 2; i <= Math.sqrt(number); i++) {
                if (number % i === 0) {
                    return false;
                }
            }
            return true;
        }`,
  },
  {
    id: 3,
    name: "Sum Of Array",
    description:
      "Write a JavaScript function to calculate the sum of numbers within an array",
    initialCode: `
      function sumOfArray(arr) {
    
    }`,
    solution: `function sumOfArray(arr) {
        let sum = 0;
        for (let num of arr) {
        sum += num;
        }
        return sum;
    }`,
  },
  {
    id: 4,
    name: "Reverse String",
    description: "Write a JavaScript function to reverse string",
    initialCode: `
      function reverseString(str) {
        
      }
    `,
    solution: `
      function reverseString(str) {
        return str.split('').reverse().join('');
      }
    `,
  },
];

module.exports = codeBlocks;
