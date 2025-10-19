 let counterBox = document.getElementById('counter-number');
    let resetBtn = document.getElementById('reset');
    let count = localStorage.getItem('count') ? Number(localStorage.getItem('count')) : 0;
    counterBox.innerText = count;

    function add() {
      count++;
      counterBox.innerText = count;
      localStorage.setItem('count', count);
    }
    function minus() {
        count--;
        counterBox.innerText = count;
        localStorage.setItem('count', count);
    }

    resetBtn.addEventListener('click', function () {
      if (confirm('Reset counter?')) {
        count = 0;
        counterBox.innerText = count;
        localStorage.setItem('count', count);
      }
    });

 document.addEventListener('dblclick', function(event) {
  event.preventDefault();
}, { passive: false });
