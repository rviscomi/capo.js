import * as logging from '../snippet/logging.js';
import { IO } from '../lib/io.js';
import { Options } from '../lib/options.js';
import * as rules from '../lib/rules.js';
import * as validation from '../lib/validation.js';


async function run() {
  const options = new Options(self?.CapoOptions);
  const io = new IO(document, options);

  await io.init();
  logging.validateHead(io, validation);
  logging.logWeights(io, validation, rules);
  const headWeights = rules.getHeadWeights(io.getHead());
  console.log('headWeights', headWeights);

  return JSON.stringify({
    actual: headWeights.map(({element, weight}) => ({
      weight,
      selector: io.stringifyElement(element),
      innerHTML: element.innerHTML,
      isValid: !validation.hasValidationWarning(element)
    })),
  });
}

return run();