/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 41:
/***/ ((module) => {

"use strict";


function _interpolate (envValue, environment, config) {
  const matches = envValue.match(/(.?\${*[\w]*(?::-)?[\w]*}*)/g) || []

  return matches.reduce(function (newEnv, match, index) {
    const parts = /(.?)\${*([\w]*(?::-)?[\w]*)?}*/g.exec(match)
    if (!parts || parts.length === 0) {
      return newEnv
    }

    const prefix = parts[1]

    let value, replacePart

    if (prefix === '\\') {
      replacePart = parts[0]
      value = replacePart.replace('\\$', '$')
    } else {
      const keyParts = parts[2].split(':-')
      const key = keyParts[0]
      replacePart = parts[0].substring(prefix.length)
      // process.env value 'wins' over .env file's value
      value = Object.prototype.hasOwnProperty.call(environment, key)
        ? environment[key]
        : (config.parsed[key] || keyParts[1] || '')

      // If the value is found, remove nested expansions.
      if (keyParts.length > 1 && value) {
        const replaceNested = matches[index + 1]
        matches[index + 1] = ''

        newEnv = newEnv.replace(replaceNested, '')
      }
      // Resolve recursive interpolations
      value = _interpolate(value, environment, config)
    }

    return newEnv.replace(replacePart, value)
  }, envValue)
}

function expand (config) {
  // if ignoring process.env, use a blank object
  const environment = config.ignoreProcessEnv ? {} : process.env

  for (const configKey in config.parsed) {
    const value = Object.prototype.hasOwnProperty.call(environment, configKey) ? environment[configKey] : config.parsed[configKey]

    config.parsed[configKey] = _interpolate(value, environment, config)
  }

  for (const processKey in config.parsed) {
    environment[processKey] = config.parsed[processKey]
  }

  return config
}

module.exports.j = expand


/***/ }),

/***/ 234:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var __webpack_unused_export__;
/* @flow */
/*::

type DotenvParseOptions = {
  debug?: boolean
}

// keys and values from src
type DotenvParseOutput = { [string]: string }

type DotenvConfigOptions = {
  path?: string, // path to .env file
  encoding?: string, // encoding of .env file
  debug?: string // turn on logging for debugging purposes
}

type DotenvConfigOutput = {
  parsed?: DotenvParseOutput,
  error?: Error
}

*/

const fs = __nccwpck_require__(147)
const path = __nccwpck_require__(17)
const os = __nccwpck_require__(37)

function log (message /*: string */) {
  console.log(`[dotenv][DEBUG] ${message}`)
}

const NEWLINE = '\n'
const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
const RE_NEWLINES = /\\n/g
const NEWLINES_MATCH = /\r\n|\n|\r/

// Parses src into an Object
function parse (src /*: string | Buffer */, options /*: ?DotenvParseOptions */) /*: DotenvParseOutput */ {
  const debug = Boolean(options && options.debug)
  const obj = {}

  // convert Buffers before splitting into lines and processing
  src.toString().split(NEWLINES_MATCH).forEach(function (line, idx) {
    // matching "KEY' and 'VAL' in 'KEY=VAL'
    const keyValueArr = line.match(RE_INI_KEY_VAL)
    // matched?
    if (keyValueArr != null) {
      const key = keyValueArr[1]
      // default undefined or missing values to empty string
      let val = (keyValueArr[2] || '')
      const end = val.length - 1
      const isDoubleQuoted = val[0] === '"' && val[end] === '"'
      const isSingleQuoted = val[0] === "'" && val[end] === "'"

      // if single or double quoted, remove quotes
      if (isSingleQuoted || isDoubleQuoted) {
        val = val.substring(1, end)

        // if double quoted, expand newlines
        if (isDoubleQuoted) {
          val = val.replace(RE_NEWLINES, NEWLINE)
        }
      } else {
        // remove surrounding whitespace
        val = val.trim()
      }

      obj[key] = val
    } else if (debug) {
      log(`did not match key and value when parsing line ${idx + 1}: ${line}`)
    }
  })

  return obj
}

function resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

// Populates process.env from .env file
function config (options /*: ?DotenvConfigOptions */) /*: DotenvConfigOutput */ {
  let dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding /*: string */ = 'utf8'
  let debug = false

  if (options) {
    if (options.path != null) {
      dotenvPath = resolveHome(options.path)
    }
    if (options.encoding != null) {
      encoding = options.encoding
    }
    if (options.debug != null) {
      debug = true
    }
  }

  try {
    // specifying an encoding returns a string instead of a buffer
    const parsed = parse(fs.readFileSync(dotenvPath, { encoding }), { debug })

    Object.keys(parsed).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key]
      } else if (debug) {
        log(`"${key}" is already defined in \`process.env\` and will not be overwritten`)
      }
    })

    return { parsed }
  } catch (e) {
    return { error: e }
  }
}

__webpack_unused_export__ = config
module.exports.Q = parse


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__nccwpck_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__nccwpck_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
__nccwpck_require__.r(__webpack_exports__);
/* harmony export */ __nccwpck_require__.d(__webpack_exports__, {
/* harmony export */   "processEnv": () => (/* binding */ processEnv),
/* harmony export */   "loadEnvConfig": () => (/* binding */ loadEnvConfig)
/* harmony export */ });
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __nccwpck_require__(147);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__nccwpck_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __nccwpck_require__(17);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__nccwpck_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var dotenv__WEBPACK_IMPORTED_MODULE_2__ = __nccwpck_require__(234);
/* harmony import */ var dotenv_expand__WEBPACK_IMPORTED_MODULE_3__ = __nccwpck_require__(41);
/* eslint-disable import/no-extraneous-dependencies */




let combinedEnv = undefined;
let cachedLoadedEnvFiles = [];
function processEnv(loadedEnvFiles, dir, log = console) {
    var _a;
    // don't reload env if we already have since this breaks escaped
    // environment values e.g. \$ENV_FILE_KEY
    if (process.env.__NEXT_PROCESSED_ENV || loadedEnvFiles.length === 0) {
        return process.env;
    }
    // flag that we processed the environment values in case a serverless
    // function is re-used or we are running in `next start` mode
    process.env.__NEXT_PROCESSED_ENV = 'true';
    const origEnv = Object.assign({}, process.env);
    const parsed = {};
    for (const envFile of loadedEnvFiles) {
        try {
            let result = {};
            result.parsed = dotenv__WEBPACK_IMPORTED_MODULE_2__/* .parse */ .Q(envFile.contents);
            result = (0,dotenv_expand__WEBPACK_IMPORTED_MODULE_3__/* .expand */ .j)(result);
            if (result.parsed) {
                log.info(`Loaded env from ${path__WEBPACK_IMPORTED_MODULE_1__.join(dir || '', envFile.path)}`);
            }
            for (const key of Object.keys(result.parsed || {})) {
                if (typeof parsed[key] === 'undefined' &&
                    typeof origEnv[key] === 'undefined') {
                    parsed[key] = (_a = result.parsed) === null || _a === void 0 ? void 0 : _a[key];
                }
            }
        }
        catch (err) {
            log.error(`Failed to load env from ${path__WEBPACK_IMPORTED_MODULE_1__.join(dir || '', envFile.path)}`, err);
        }
    }
    return Object.assign(process.env, parsed);
}
function loadEnvConfig(dir, dev, log = console) {
    // don't reload env if we already have since this breaks escaped
    // environment values e.g. \$ENV_FILE_KEY
    if (combinedEnv)
        return { combinedEnv, loadedEnvFiles: cachedLoadedEnvFiles };
    const isTest = process.env.NODE_ENV === 'test';
    const mode = isTest ? 'test' : dev ? 'development' : 'production';
    const dotenvFiles = [
        `.env.${mode}.local`,
        // Don't include `.env.local` for `test` environment
        // since normally you expect tests to produce the same
        // results for everyone
        mode !== 'test' && `.env.local`,
        `.env.${mode}`,
        '.env',
    ].filter(Boolean);
    for (const envFile of dotenvFiles) {
        // only load .env if the user provided has an env config file
        const dotEnvPath = path__WEBPACK_IMPORTED_MODULE_1__.join(dir, envFile);
        try {
            const stats = fs__WEBPACK_IMPORTED_MODULE_0__.statSync(dotEnvPath);
            // make sure to only attempt to read files
            if (!stats.isFile()) {
                continue;
            }
            const contents = fs__WEBPACK_IMPORTED_MODULE_0__.readFileSync(dotEnvPath, 'utf8');
            cachedLoadedEnvFiles.push({
                path: envFile,
                contents,
            });
        }
        catch (err) {
            if (err.code !== 'ENOENT') {
                log.error(`Failed to load env from ${envFile}`, err);
            }
        }
    }
    combinedEnv = processEnv(cachedLoadedEnvFiles, dir, log);
    return { combinedEnv, loadedEnvFiles: cachedLoadedEnvFiles };
}

})();

module.exports = __webpack_exports__;
/******/ })()
;