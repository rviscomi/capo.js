import * as logging from './logging.js';
import { IO } from '../lib/io.js';
import { Options } from '../lib/options.js';
import * as rules from '../lib/rules.js';
import * as validation from '../lib/validation.js';


const CAPO_GLOBAL = '__CAPO__';

async function run() {
  const options = new Options(self[CAPO_GLOBAL]);
  const io = new IO(document, options);

  await io.init();
  logging.validateHead(io, validation);
  logging.logWeights(io, validation, rules);
} 

run();
