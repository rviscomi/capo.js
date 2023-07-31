import * as capo from '../main.js';
import * as logging from './logging.js';


const CAPO_GLOBAL = '__CAPO__';

async function run() {
  const options = new capo.options.Options(self[CAPO_GLOBAL]);
  const io = new capo.io.IO(document, options);

  await io.init();
  logging.validateHead(io, capo.validation);
  logging.logWeights(io, capo.validation, capo.rules);
} 

run();
