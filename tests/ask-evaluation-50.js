
'use strict';

const fs = require('fs');

module.exports = function loadAskEvaluationCorpus() {
  const path = __dirname + '/../docs/ask-evaluation-corpus.md';
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
  });

  return {
    entries: entries,
    questions: questions
  };
};
