let count = 0;

const counterDisplay = document.getElementById('counter');
const hitungButton = document.getElementById('hitung');
const resetButton = document.getElementById('reset');

// Reset counter
resetButton.addEventListener('click', () => {
    resetCounter();
});

function resetCounter() {
    count = 0;
    counterDisplay.textContent = count;
}