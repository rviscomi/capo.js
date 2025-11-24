import * as capo from '../main.js';


const FORCED_OPTIONS = {
  preferredAssessmentMode: capo.options.Options.AssessmentMode.DYNAMIC
};

/**
 * Interface for the capo.js web client.
 * 
 * For configuration options see:
 * https://rviscomi.github.io/capo.js/user/config/
 * 
 * @param input HTML string
 * @param output Mock console implementation
 * @param options Capo options
 */
export function run(input, output, userOptions={}) {
  userOptions = Object.assign(userOptions, FORCED_OPTIONS);

  const staticDoc = document.implementation.createHTMLDocument('New Document');
  staticDoc.documentElement.innerHTML = input;

  const options = new capo.options.Options(userOptions);
  const io = new capo.io.IO(staticDoc.documentElement, options, output);

  io.init();
  logging.logAnalysis(io);
} 
