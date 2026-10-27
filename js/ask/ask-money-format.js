var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.moneyFormat = (function () {
  function formatMoney(n) {
    var whole = Math.round(n * 100) % 100 === 0;
    return '£' + n.toLocaleString('en-GB', {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  return {
    formatMoney: formatMoney
  };
})();