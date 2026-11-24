
'use strict';

const fs = require('fs');

module.exports = function loadAskEvaluationCorpus() {
  const path = __dirname + '/../docs/personal-memory-evaluation.md';
  const markdown = fs.readFileSync(path, 'utf8');
  const lines = markdown.split(/\r?\n/);

  const noteLines = lines.filter(function (line) {
    return /^M\d{2}\s*\|/.test(line.trim());
  });

  const questionLines = lines.filter(function (line) {
    return /^\d+\s*\|/.test(line.trim());
  });

  const entries = noteLines.map(function (line) {
    const fields = line.split('|').map(function (field) {
      return field.trim();
    });

    if (fields.length !== 5) {
      throw new Error('Invalid benchmark note row: ' + line);
    }

    const when = fields[3] === '—' ? null : fields[3];

    const entry = {
      id: fields[0],
      room: fields[1],
      created: fields[2],
      text: fields[4]
    };

    if (when !== null) {
      entry.when = when;
      entry.hasTime = /T\d{2}:\d{2}/.test(when);
    }

    if (
      when !== null &&
      ['appointments', 'todo'].indexOf(entry.room) !== -1
    ) {
      entry.done = false;
    }

    return entry;
  });

  const questions = questionLines.map(function (line) {
    const fields = line.split('|').map(function (field) {
      return field.trim();
    });

    if (fields.length !== 4) {
      throw new Error('Invalid benchmark question row: ' + line);
    }

    const label = fields[2];
    let behaviour;

    if (/^clarify/i.test(label)) {
      behaviour = 'clarify';
    } else if (/^abstain/i.test(label)) {
      behaviour = 'abstain';
    } else if (/^answer/i.test(label)) {
      behaviour = 'answer';
    } else {
      throw new Error(
        'Unknown expected behaviour for question ' + fields[0]
      );
    }

    const sources = fields[3] === 'None'
      ? []
      : fields[3].split(',').map(function (id) {
          return id.trim();
        });

    return {
      number: Number(fields[0]),
      question: fields[1],
      expectedLabel: label,
      expectedBehaviour: behaviour,
      expectedSources: sources
    };
  });

  const expectedResponses = {
    1: /lemon drizzle cake/i,
    2: /Italian bakery.*Station Road/i,
    3: /(?=.*raised wooden beds)(?=.*herb section)(?=.*replacement panels)(?=.*solar lights)/i,
    4: /stainless steel kettle|kettle.*stainless steel/i,
    5: /Grand Budapest Hotel/i,
    6: /chicken and mushroom pie/i,
    7: /fictional-test-4821/,
    8: /07700 900123/,
    9: /(?=.*£280)(?=.*(?:quote|estimate))/i,
    10: /Dave/i,
    11: /different scheduled dates|which entry|which dentist/i,
    12: /Northside Builders Merchants/i,
    13: /(?=.*Dave)(?=.*16 November)/i,
    14: /York.*Lincoln|Lincoln.*York/i,
    15: /(?=.*Jasmine)(?=.*silver star necklace)/i,
    16: /(?=.*coastal walk)(?=.*museum)/i,
    17: /16 November/i,
    18: /21 November/i,
    19: /(?=.*27 November)(?=.*14:30)/i,
    20: /could not find|do not have|not saved|will not guess/i,
    21: /could not find|do not have|not saved|will not guess/i,
    22: /could not find|do not have|not saved|will not guess/i,
    23: /could not find|do not have|not saved|will not guess/i,
    24: /could not find|do not have|not saved|will not guess/i,
    25: /could not find|do not have|not saved|will not guess/i,
    26: /(?=.*blue zipped pocket)(?=.*black rucksack)/i,
    27: /(?=.*24 November)(?=.*09:15)/i,
    28: /(?=.*lighthouse keeper)(?=.*rotate the light)/i,
    29: /Great British Bake Off/i,
    30: /(?=.*book boiler service)(?=.*birthday parcel)(?=.*measure the spare room)/i,
    31: /(?=.*Lego space rover)(?=.*blue football shirt)/i,
    32: /(?=.*ceramic pot)(?=.*hallway cupboard)/i,
    33: /Morgan/i,
    34: /£100/,
    35: /£150/,
    36: /(?=.*grey document wallet)(?=.*desk drawer)/i,
    37: /20 November/i,
    38: /dark green/i,
    39: /roasted tomato and red pepper soup/i,
    40: /prescription/i,
    41: /£35/,
    42: /30 November/i,
    43: /(?=.*23 November)(?=.*11(:00|am))/i,
    44: /(?=.*front left tyre)(?=.*losing pressure)/i,
    45: /(?=.*labelled box)(?=.*utility cupboard)/i,
    46: /(?=.*spare room)(?=.*measur)/i,
    47: /medium roast ground coffee/i,
    48: /size 9|size nine/i,
    49: /(?=.*hallway light bulb)(?=.*replac)/i,
    50: /could not find|do not have|not saved|will not guess/i
  };

  if (entries.length !== 50) {
    throw new Error(
      'Expected 50 benchmark notes, found ' + entries.length
    );
  }

  if (questions.length !== 50) {
    throw new Error(
      'Expected 50 benchmark questions, found ' + questions.length
    );
  }

  if (Object.keys(expectedResponses).length !== 50) {
    throw new Error('Expected response criteria must cover all 50 questions');
  }

  const entryIds = Object.create(null);

  entries.forEach(function (entry) {
    if (entryIds[entry.id]) {
      throw new Error('Duplicate benchmark note ID: ' + entry.id);
    }

    entryIds[entry.id] = true;
  });

  questions.forEach(function (item, index) {
    if (item.number !== index + 1) {
      throw new Error(
        'Benchmark question numbering is incorrect at ' + item.number
      );
    }

    item.expectedSources.forEach(function (id) {
      if (!entryIds[id]) {
        throw new Error(
          'Question ' + item.number +
          ' references missing source ' + id
        );
      }
    });

    if (!expectedResponses[item.number]) {
      throw new Error(
        'Question ' + item.number + ' has no expected response criterion'
      );
    }

    item.expectedResponse = expectedResponses[item.number];
  });

  return {
    entries: entries,
    questions: questions
  };
};
