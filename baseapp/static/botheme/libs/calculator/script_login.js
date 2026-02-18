const calculator = {
  displayValue: '',
};

function inputDigit(digit) {
  const { displayValue } = calculator;


    // Check if the input is a number or asterisk (*)
    if (/^[0-9*]$/.test(digit)) {
      calculator.displayValue = displayValue === '' ? digit : displayValue + digit;
    }

}

// Rest of the code remains the same

// Add event listeners for keyboard input
document.addEventListener('keydown', (event) => {
  const { key } = event;

  if (/^[0-9*]$/.test(key)) {
    //inputDigit(key);
    //updateDisplay();
  } else if (key === 'Escape' || key === 'Delete') {
    resetCalculator();
    updateDisplay();
  } else if (key === 'Backspace') {
    // Handle the 'Backspace' key to remove the last character
    calculator.displayValue = calculator.displayValue.slice(0, -1);
    updateDisplay();
  }
});

const keys = document.querySelector('.calculator-keys');
keys.addEventListener('click', (event) => {
  const { target } = event;
  if (!target.matches('button')) {
    return;
  }




  if (target.classList.contains('all-clear')) {
    resetCalculator();
    updateDisplay();
    return;
  }

  inputDigit(target.value);
  updateDisplay();
});

function resetCalculator() {
  calculator.displayValue = '';
  calculator.firstOperand = null;
  calculator.waitingForSecondOperand = false;
  calculator.operator = null;
}

function updateDisplay() {
  const display = document.querySelector('.calculator-screen');
  display.value = calculator.displayValue;
}

updateDisplay();
