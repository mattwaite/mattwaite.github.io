window.addEventListener('load', () => {
  const canvas = document.getElementById('display');
  const game   = new Game(canvas);
  game.start();
});
