/* An example explorer. It reads "Codes are N characters long, drawn from M symbols" from the
   spec text, so editing the spec changes the page after a re-render. */
(() => {
  'use strict';
  const P = window.SpecPage;
  const m = P.spec.textContent.match(/(\d+) characters long, drawn from (\d+) symbols/);
  const start = () => {
    const len = P.$('#len');
    const symbols = m ? +m[2] : 62;
    len.value = m ? m[1] : 7;
    const paint = () => {
      P.$('#lenOut').value = len.value;
      const total = symbols ** +len.value;
      P.$('#cap').textContent = `${symbols}^${len.value} = ${total.toLocaleString()} possible codes. At 1,000 new links a day that lasts ${Math.floor(total / 1000 / 365).toLocaleString()} years, before collisions.`;
    };
    len.addEventListener('input', paint);
    paint();
  };
  P.extras = { start };
})();
