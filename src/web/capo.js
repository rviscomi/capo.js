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
 * @param {string} input HTML string
 * @param {any} output Mock console implementation
 * @param {import("@rviscomi/capo.js/lib/options").OptionsInit & { pageOrigin?: string }} [userOptions={}] Capo options
 */
export function run(input, output, userOptions={}) {
  const pageOrigin = userOptions.pageOrigin || null;
  userOptions = Object.assign({}, userOptions, FORCED_OPTIONS);

  const options = new Options(userOptions);
  const io = new IO(null, options, output);
  io.initFromHTML(input);

  const headElement = io.getHead();
  const adapter = new BrowserAdapter();
  const result = analyzeHead(headElement, adapter, { pageOrigin });

  io.logAnalysis(result);
}
