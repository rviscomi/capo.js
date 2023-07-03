import * as console from './logging.js';
import { IO } from '../lib/io.js';
import { Options } from '../lib/options.js';
import * as rules from '../lib/rules.js';
import * as validation from '../lib/validation.js';

async function run() {
  const options = new Options(self?.CapoOptions);
  const io = new IO(document, options);

  await io.init();
  console.validateHead(io, validation);
  console.logWeights(io, validation, rules);
} 

run();