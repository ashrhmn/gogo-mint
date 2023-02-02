export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const multiply = function (a: number, b: number) {
  var commonMultiplier = 1000000;

  a *= commonMultiplier;
  b *= commonMultiplier;

  return (a * b) / (commonMultiplier * commonMultiplier);
};
