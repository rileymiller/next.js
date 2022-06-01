"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.clearModuleContext = clearModuleContext;
exports.getModuleContext = getModuleContext;
var _constants = require("../../../shared/lib/constants");
var _edgeRuntime = require("next/dist/compiled/edge-runtime");
var _fs = require("fs");
var _utils = require("../utils");
const WEBPACK_HASH_REGEX = /__webpack_require__\.h = function\(\) \{ return "[0-9a-f]+"; \}/g;
function clearModuleContext(path, content) {
    for (const [key, cache] of moduleContexts){
        var ref;
        const prev = (ref = cache === null || cache === void 0 ? void 0 : cache.paths.get(path)) === null || ref === void 0 ? void 0 : ref.replace(WEBPACK_HASH_REGEX, '');
        if (typeof prev !== 'undefined' && prev !== content.toString().replace(WEBPACK_HASH_REGEX, '')) {
            moduleContexts.delete(key);
        }
    }
}
/**
 * A Map of cached module contexts indexed by the module name. It allows
 * to have a different cache scoped per module name or depending on the
 * provided module key on creation.
 */ const moduleContexts = new Map();
const pendingModuleCaches = new Map();
function getModuleContextShared(options) {
    let deferredModuleContext = pendingModuleCaches.get(options.moduleName);
    if (!deferredModuleContext) {
        deferredModuleContext = createModuleContext(options);
        pendingModuleCaches.set(options.moduleName, deferredModuleContext);
    }
    return deferredModuleContext;
}
async function getModuleContext(options) {
    let moduleContext = options.useCache ? moduleContexts.get(options.moduleName) : await getModuleContextShared(options);
    if (!moduleContext) {
        moduleContext = await createModuleContext(options);
        moduleContexts.set(options.moduleName, moduleContext);
    }
    const evaluateInContext = (filepath)=>{
        if (!moduleContext.paths.has(filepath)) {
            const content = (0, _fs).readFileSync(filepath, 'utf-8');
            try {
                moduleContext === null || moduleContext === void 0 ? void 0 : moduleContext.runtime.evaluate(content);
                moduleContext.paths.set(filepath, content);
            } catch (error) {
                if (options.useCache) {
                    moduleContext === null || moduleContext === void 0 ? void 0 : moduleContext.paths.delete(options.moduleName);
                }
                throw error;
            }
        }
    };
    return {
        ...moduleContext,
        evaluateInContext
    };
}
/**
 * Create a module cache specific for the provided parameters. It includes
 * a runtime context, require cache and paths cache.
 */ async function createModuleContext(options) {
    const warnedEvals = new Set();
    const wasm = await loadWasm(options.wasm);
    const runtime = new _edgeRuntime.EdgeRuntime({
        codeGeneration: process.env.NODE_ENV !== 'production' ? {
            strings: true,
            wasm: false
        } : undefined,
        extend: (context)=>{
            context.process = createProcessPolyfill(options);
            context.__next_eval__ = function __next_eval__(fn) {
                const key = fn.toString();
                if (!warnedEvals.has(key)) {
                    const warning = new Error(`Dynamic Code Evaluation (e. g. 'eval', 'new Function') not allowed in Middleware`);
                    warning.name = 'DynamicCodeEvaluationWarning';
                    Error.captureStackTrace(warning, __next_eval__);
                    warnedEvals.add(key);
                    options.onWarning(warning);
                }
                return fn();
            };
            const __fetch = context.fetch;
            context.fetch = (input, init = {})=>{
                var ref;
                var _headers;
                init.headers = new Headers((_headers = init.headers) !== null && _headers !== void 0 ? _headers : {});
                const prevs = ((ref = init.headers.get(`x-middleware-subrequest`)) === null || ref === void 0 ? void 0 : ref.split(':')) || [];
                const value = prevs.concat(options.moduleName).join(':');
                init.headers.set('x-middleware-subrequest', value);
                if (!init.headers.has('user-agent')) {
                    init.headers.set(`user-agent`, `Next.js Middleware`);
                }
                if (typeof input === 'object' && 'url' in input) {
                    return __fetch(input.url, {
                        ...init,
                        headers: {
                            ...Object.fromEntries(input.headers),
                            ...Object.fromEntries(init.headers)
                        }
                    });
                }
                return __fetch(String(input), init);
            };
            const __Request = context.Request;
            context.Request = class extends __Request {
                constructor(input, init){
                    const url = typeof input === 'string' ? input : input.url;
                    (0, _utils).validateURL(url);
                    super(input, init);
                }
            };
            const __redirect = context.Response.redirect.bind(context.Response);
            context.Response.redirect = (...args)=>{
                (0, _utils).validateURL(args[0]);
                return __redirect(...args);
            };
            for (const name of _constants.EDGE_UNSUPPORTED_NODE_APIS){
                addStub(context, name, options);
            }
            Object.assign(context, wasm);
            return context;
        }
    });
    return {
        runtime,
        paths: new Map(),
        warnedEvals: new Set()
    };
}
async function loadWasm(wasm) {
    const modules = {};
    await Promise.all(wasm.map(async (binding)=>{
        const module = await WebAssembly.compile(await _fs.promises.readFile(binding.filePath));
        modules[binding.name] = module;
    }));
    return modules;
}
function buildEnvironmentVariablesFrom(keys) {
    const pairs = keys.map((key)=>[
            key,
            process.env[key]
        ]
    );
    const env = Object.fromEntries(pairs);
    env.NEXT_RUNTIME = 'edge';
    return env;
}
function createProcessPolyfill(options) {
    const env = buildEnvironmentVariablesFrom(options.env);
    const processPolyfill = {
        env
    };
    const overridenValue = {};
    for (const key of Object.keys(process)){
        if (key === 'env') continue;
        Object.defineProperty(processPolyfill, key, {
            get () {
                emitWarning(`process.${key}`, options);
                return overridenValue[key];
            },
            set (value) {
                overridenValue[key] = value;
            },
            enumerable: false
        });
    }
    return processPolyfill;
}
const warnedAlready = new Set();
function addStub(context, name, contextOptions) {
    Object.defineProperty(context, name, {
        get () {
            emitWarning(name, contextOptions);
            return undefined;
        },
        enumerable: false
    });
}
function emitWarning(name, contextOptions) {
    if (!warnedAlready.has(name)) {
        const warning = new Error(`You're using a Node.js API (${name}) which is not supported in the Edge Runtime that Middleware uses.
Learn more: https://nextjs.org/docs/api-reference/edge-runtime`);
        warning.name = 'NodejsRuntimeApiInMiddlewareWarning';
        contextOptions.onWarning(warning);
        console.warn(warning.message);
        warnedAlready.add(name);
    }
}

//# sourceMappingURL=context.js.map