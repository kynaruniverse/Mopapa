
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.text = (function () {
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9£]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function words(s) {
    var n = norm(s);
    return n ? n.split(' ') : [];
  }

  function hasPhrase(haystack, phrase) {
    return (' ' + norm(haystack) + ' ').indexOf(
      ' ' + norm(phrase) + ' '
    ) !== -1;
  }

  function stem(w) {
    var irregular = {
      paid: 'pay', spent: 'spend', spending: 'spend',
      bought: 'buy', buying: 'buy', kept: 'keep', left: 'leave'
    };

    if (irregular[w]) w = irregular[w];

    var base = w;

    if (base.length > 4 && /ies$/.test(base)) {
      base = base.slice(0, -3) + 'y';
    } else if (base.length > 4 && /(ches|shes|sses|xes|zes)$/.test(base)) {
      base = base.slice(0, -2);
    } else if (base.length > 3 && /s$/.test(base) && !/ss$/.test(base)) {
      base = base.slice(0, -1);
    }

    var verb = null;

    if (base.length > 5 && /ing$/.test(base)) {
      verb = base.slice(0, -3);
    } else if (base.length > 4 && /ed$/.test(base)) {
      verb = base.slice(0, -2);
    }

    // Only accept the cut if a vowel remains ("string" stays "string").
    if (verb && /[aeiouy]/.test(verb)) {
      base = verb.replace(/([^aeiouylsz])\1$/, '$1'); // stopp -> stop
    }

    // store/stored/storing all become "stor".
    if (base.length > 3 && /e$/.test(base)) {
      base = base.slice(0, -1);
    }

    return base;
  }

  return {
    norm: norm,
    words: words,
    hasPhrase: hasPhrase,
    stem: stem
  };
})();
