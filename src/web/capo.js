import { analyzeHead } from "@rviscomi/capo.js";
import { BrowserAdapter } from "@rviscomi/capo.js/adapters/browser";
import { IO } from "@rviscomi/capo.js/lib/io";
import { Options } from "@rviscomi/capo.js/lib/options";


const FORCED_OPTIONS = {
  preferredAssessmentMode: Options.AssessmentMode.DYNAMIC
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

  const options = new Options(userOptions);
  const io = new IO(staticDoc.documentElement, options, output);

  io.init();
  const headElement = io.getHead();
  const adapter = new BrowserAdapter();
  const result = analyzeHead(headElement, adapter);

  io.logAnalysis(result);
}
