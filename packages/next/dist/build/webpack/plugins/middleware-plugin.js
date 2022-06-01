"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _routeRegex = require("../../../shared/lib/router/utils/route-regex");
var _getModuleBuildInfo = require("../loaders/get-module-build-info");
var _utils = require("../../../shared/lib/router/utils");
var _webpack = require("next/dist/compiled/webpack/webpack");
var _constants = require("../../../shared/lib/constants");
const NAME = 'MiddlewarePlugin';
const middlewareManifest = {
    sortedMiddleware: [],
    clientInfo: [],
    middleware: {},
    functions: {},
    version: 1
};
class MiddlewarePlugin {
    constructor({ dev  }){
        this.dev = dev;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(NAME, (compilation, params)=>{
            const { hooks  } = params.normalModuleFactory;
            /**
       * This is the static code analysis phase.
       */ const codeAnalyzer = getCodeAnalizer({
                dev: this.dev,
                compiler,
                compilation
            });
            hooks.parser.for('javascript/auto').tap(NAME, codeAnalyzer);
            hooks.parser.for('javascript/dynamic').tap(NAME, codeAnalyzer);
            hooks.parser.for('javascript/esm').tap(NAME, codeAnalyzer);
            /**
       * Extract all metadata for the entry points in a Map object.
       */ const metadataByEntry = new Map();
            compilation.hooks.afterOptimizeModules.tap(NAME, getExtractMetadata({
                compilation,
                compiler,
                dev: this.dev,
                metadataByEntry
            }));
            /**
       * Emit the middleware manifest.
       */ compilation.hooks.processAssets.tap({
                name: 'NextJsMiddlewareManifest',
                stage: _webpack.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            }, getCreateAssets({
                compilation,
                metadataByEntry
            }));
        });
    }
}
exports.default = MiddlewarePlugin;
function getCodeAnalizer(params) {
    return (parser)=>{
        const { dev , compiler: { webpack: wp  } , compilation ,  } = params;
        const { hooks  } = parser;
        /**
     * This expression handler allows to wrap a dynamic code expression with a
     * function call where we can warn about dynamic code not being allowed
     * but actually execute the expression.
     */ const handleWrapExpression = (expr)=>{
            if (!isInMiddlewareLayer(parser)) {
                return;
            }
            if (dev) {
                const { ConstDependency  } = wp.dependencies;
                const dep1 = new ConstDependency('__next_eval__(function() { return ', expr.range[0]);
                dep1.loc = expr.loc;
                parser.state.module.addPresentationalDependency(dep1);
                const dep2 = new ConstDependency('})', expr.range[1]);
                dep2.loc = expr.loc;
                parser.state.module.addPresentationalDependency(dep2);
            }
            handleExpression();
            return true;
        };
        /**
     * For an expression this will check the graph to ensure it is being used
     * by exports. Then it will store in the module buildInfo a boolean to
     * express that it contains dynamic code and, if it is available, the
     * module path that is using it.
     */ const handleExpression = ()=>{
            if (!isInMiddlewareLayer(parser)) {
                return;
            }
            wp.optimize.InnerGraph.onUsage(parser.state, (used = true)=>{
                const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(parser.state.module);
                if (buildInfo.usingIndirectEval === true || used === false) {
                    return;
                }
                if (!buildInfo.usingIndirectEval || used === true) {
                    buildInfo.usingIndirectEval = used;
                    return;
                }
                buildInfo.usingIndirectEval = new Set([
                    ...Array.from(buildInfo.usingIndirectEval),
                    ...Array.from(used), 
                ]);
            });
        };
        /**
     * A handler for calls to `process.env` where we identify the name of the
     * ENV variable being assigned and store it in the module info.
     */ const handleCallMemberChain = (_, members)=>{
            if (members.length >= 2 && members[0] === 'env') {
                const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(parser.state.module);
                if (buildInfo.nextUsedEnvVars === undefined) {
                    buildInfo.nextUsedEnvVars = new Set();
                }
                buildInfo.nextUsedEnvVars.add(members[1]);
                if (!isInMiddlewareLayer(parser)) {
                    return true;
                }
            }
        };
        /**
     * A handler for calls to `new Response()` so we can fail if user is setting the response's body.
     */ const handleNewResponseExpression = (node)=>{
            var ref;
            const firstParameter = node === null || node === void 0 ? void 0 : (ref = node.arguments) === null || ref === void 0 ? void 0 : ref[0];
            if (isInMiddlewareFile(parser) && firstParameter && !isNullLiteral(firstParameter) && !isUndefinedIdentifier(firstParameter)) {
                const error = new wp.WebpackError(`Your middleware is returning a response body (line: ${node.loc.start.line}), which is not supported. Learn more: https://nextjs.org/docs/messages/returning-response-body-in-middleware`);
                error.name = NAME;
                error.module = parser.state.current;
                error.loc = node.loc;
                if (dev) {
                    compilation.warnings.push(error);
                } else {
                    compilation.errors.push(error);
                }
            }
        };
        /**
     * A noop handler to skip analyzing some cases.
     * Order matters: for it to work, it must be registered first
     */ const skip = ()=>isInMiddlewareLayer(parser) ? true : undefined
        ;
        for (const prefix of [
            '',
            'global.'
        ]){
            hooks.expression.for(`${prefix}Function.prototype`).tap(NAME, skip);
            hooks.expression.for(`${prefix}Function.bind`).tap(NAME, skip);
            hooks.call.for(`${prefix}eval`).tap(NAME, handleWrapExpression);
            hooks.call.for(`${prefix}Function`).tap(NAME, handleWrapExpression);
            hooks.new.for(`${prefix}Function`).tap(NAME, handleWrapExpression);
            hooks.expression.for(`${prefix}eval`).tap(NAME, handleExpression);
            hooks.expression.for(`${prefix}Function`).tap(NAME, handleExpression);
        }
        hooks.new.for('Response').tap(NAME, handleNewResponseExpression);
        hooks.new.for('NextResponse').tap(NAME, handleNewResponseExpression);
        hooks.callMemberChain.for('process').tap(NAME, handleCallMemberChain);
        hooks.expressionMemberChain.for('process').tap(NAME, handleCallMemberChain);
        registerUnsupportedApiHooks(parser, compilation);
    };
}
function getExtractMetadata(params) {
    const { dev , compilation , metadataByEntry , compiler  } = params;
    const { webpack: wp  } = compiler;
    return ()=>{
        metadataByEntry.clear();
        for (const [entryName, entryData] of compilation.entries){
            if (entryData.options.runtime !== _constants.EDGE_RUNTIME_WEBPACK) {
                continue;
            }
            const { moduleGraph  } = compilation;
            const entryModules = new Set();
            const addEntriesFromDependency = (dependency)=>{
                const module = moduleGraph.getModule(dependency);
                if (module) {
                    entryModules.add(module);
                }
            };
            entryData.dependencies.forEach(addEntriesFromDependency);
            entryData.includeDependencies.forEach(addEntriesFromDependency);
            const entryMetadata = {
                env: new Set(),
                wasmBindings: new Set()
            };
            for (const entryModule of entryModules){
                const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(entryModule);
                /**
         * When building for production checks if the module is using `eval`
         * and in such case produces a compilation error. The module has to
         * be in use.
         */ if (!dev && buildInfo.usingIndirectEval && isUsingIndirectEvalAndUsedByExports({
                    entryModule: entryModule,
                    moduleGraph: moduleGraph,
                    runtime: wp.util.runtime.getEntryRuntime(compilation, entryName),
                    usingIndirectEval: buildInfo.usingIndirectEval,
                    wp
                })) {
                    const id = entryModule.identifier();
                    if (/node_modules[\\/]regenerator-runtime[\\/]runtime\.js/.test(id)) {
                        continue;
                    }
                    const error = new wp.WebpackError(`Dynamic Code Evaluation (e. g. 'eval', 'new Function') not allowed in Middleware ${entryName}${typeof buildInfo.usingIndirectEval !== 'boolean' ? `\nUsed by ${Array.from(buildInfo.usingIndirectEval).join(', ')}` : ''}`);
                    error.module = entryModule;
                    compilation.errors.push(error);
                }
                /**
         * The entry module has to be either a page or a middleware and hold
         * the corresponding metadata.
         */ if (buildInfo === null || buildInfo === void 0 ? void 0 : buildInfo.nextEdgeSSR) {
                    entryMetadata.edgeSSR = buildInfo.nextEdgeSSR;
                } else if (buildInfo === null || buildInfo === void 0 ? void 0 : buildInfo.nextEdgeMiddleware) {
                    entryMetadata.edgeMiddleware = buildInfo.nextEdgeMiddleware;
                } else if (buildInfo === null || buildInfo === void 0 ? void 0 : buildInfo.nextEdgeApiFunction) {
                    entryMetadata.edgeApiFunction = buildInfo.nextEdgeApiFunction;
                }
                /**
         * If there are env vars found in the module, append them to the set
         * of env vars for the entry.
         */ if ((buildInfo === null || buildInfo === void 0 ? void 0 : buildInfo.nextUsedEnvVars) !== undefined) {
                    for (const envName of buildInfo.nextUsedEnvVars){
                        entryMetadata.env.add(envName);
                    }
                }
                /**
         * If the module is a WASM module we read the binding information and
         * append it to the entry wasm bindings.
         */ if (buildInfo === null || buildInfo === void 0 ? void 0 : buildInfo.nextWasmMiddlewareBinding) {
                    entryMetadata.wasmBindings.add(buildInfo.nextWasmMiddlewareBinding);
                }
                /**
         * Append to the list of modules to process outgoingConnections from
         * the module that is being processed.
         */ for (const conn of moduleGraph.getOutgoingConnections(entryModule)){
                    if (conn.module) {
                        entryModules.add(conn.module);
                    }
                }
            }
            metadataByEntry.set(entryName, entryMetadata);
        }
    };
}
/**
 * Checks the value of usingIndirectEval and when it is a set of modules it
 * check if any of the modules is actually being used. If the value is
 * simply truthy it will return true.
 */ function isUsingIndirectEvalAndUsedByExports(args) {
    const { moduleGraph , runtime , entryModule , usingIndirectEval , wp  } = args;
    if (typeof usingIndirectEval === 'boolean') {
        return usingIndirectEval;
    }
    const exportsInfo = moduleGraph.getExportsInfo(entryModule);
    for (const exportName of usingIndirectEval){
        if (exportsInfo.getUsed(exportName, runtime) !== wp.UsageState.Unused) {
            return true;
        }
    }
    return false;
}
function getCreateAssets(params) {
    const { compilation , metadataByEntry  } = params;
    return (assets)=>{
        for (const entrypoint of compilation.entrypoints.values()){
            var ref, ref1, ref2;
            if (!entrypoint.name) {
                continue;
            }
            // There should always be metadata for the entrypoint.
            const metadata = metadataByEntry.get(entrypoint.name);
            const page = (metadata === null || metadata === void 0 ? void 0 : (ref = metadata.edgeMiddleware) === null || ref === void 0 ? void 0 : ref.page) || (metadata === null || metadata === void 0 ? void 0 : (ref1 = metadata.edgeSSR) === null || ref1 === void 0 ? void 0 : ref1.page) || (metadata === null || metadata === void 0 ? void 0 : (ref2 = metadata.edgeApiFunction) === null || ref2 === void 0 ? void 0 : ref2.page);
            if (!page) {
                continue;
            }
            const { namedRegex  } = (0, _routeRegex).getNamedMiddlewareRegex(page, {
                catchAll: !metadata.edgeSSR && !metadata.edgeApiFunction
            });
            const edgeFunctionDefinition = {
                env: Array.from(metadata.env),
                files: getEntryFiles(entrypoint.getFiles(), metadata),
                name: entrypoint.name,
                page: page,
                regexp: namedRegex,
                wasm: Array.from(metadata.wasmBindings)
            };
            if (metadata.edgeApiFunction /* || metadata.edgeSSR */ ) {
                middlewareManifest.functions[page] = edgeFunctionDefinition;
            } else {
                middlewareManifest.middleware[page] = edgeFunctionDefinition;
            }
        }
        middlewareManifest.sortedMiddleware = (0, _utils).getSortedRoutes(Object.keys(middlewareManifest.middleware));
        middlewareManifest.clientInfo = middlewareManifest.sortedMiddleware.map((key)=>{
            var ref;
            return [
                key,
                !!((ref = metadataByEntry.get(middlewareManifest.middleware[key].name)) === null || ref === void 0 ? void 0 : ref.edgeSSR), 
            ];
        });
        assets[_constants.MIDDLEWARE_MANIFEST] = new _webpack.sources.RawSource(JSON.stringify(middlewareManifest, null, 2));
    };
}
function getEntryFiles(entryFiles, meta) {
    const files = [];
    if (meta.edgeSSR) {
        if (meta.edgeSSR.isServerComponent) {
            files.push(`server/${_constants.MIDDLEWARE_FLIGHT_MANIFEST}.js`);
            files.push(...entryFiles.filter((file)=>file.startsWith('pages/') && !file.endsWith('.hot-update.js')
            ).map((file)=>'server/' + file.replace('.js', _constants.NEXT_CLIENT_SSR_ENTRY_SUFFIX + '.js')
            ));
        }
        files.push(`server/${_constants.MIDDLEWARE_BUILD_MANIFEST}.js`, `server/${_constants.MIDDLEWARE_REACT_LOADABLE_MANIFEST}.js`);
    }
    files.push(...entryFiles.filter((file)=>!file.endsWith('.hot-update.js')
    ).map((file)=>'server/' + file
    ));
    return files;
}
function registerUnsupportedApiHooks(parser, compilation) {
    const { WebpackError  } = compilation.compiler.webpack;
    for (const expression of _constants.EDGE_UNSUPPORTED_NODE_APIS){
        const warnForUnsupportedApi = (node)=>{
            if (!isInMiddlewareLayer(parser)) {
                return;
            }
            compilation.warnings.push(makeUnsupportedApiError(WebpackError, parser, expression, node.loc));
            return true;
        };
        parser.hooks.call.for(expression).tap(NAME, warnForUnsupportedApi);
        parser.hooks.expression.for(expression).tap(NAME, warnForUnsupportedApi);
        parser.hooks.callMemberChain.for(expression).tap(NAME, warnForUnsupportedApi);
        parser.hooks.expressionMemberChain.for(expression).tap(NAME, warnForUnsupportedApi);
    }
    const warnForUnsupportedProcessApi = (node, [callee])=>{
        if (!isInMiddlewareLayer(parser) || callee === 'env') {
            return;
        }
        compilation.warnings.push(makeUnsupportedApiError(WebpackError, parser, `process.${callee}`, node.loc));
        return true;
    };
    parser.hooks.callMemberChain.for('process').tap(NAME, warnForUnsupportedProcessApi);
    parser.hooks.expressionMemberChain.for('process').tap(NAME, warnForUnsupportedProcessApi);
}
function makeUnsupportedApiError(WebpackError, parser, name, loc) {
    const error = new WebpackError(`You're using a Node.js API (${name} at line: ${loc.start.line}) which is not supported in the Edge Runtime that Middleware uses. 
Learn more: https://nextjs.org/docs/api-reference/edge-runtime`);
    error.name = NAME;
    error.module = parser.state.current;
    error.loc = loc;
    return error;
}
function isInMiddlewareLayer(parser) {
    var ref;
    return ((ref = parser.state.module) === null || ref === void 0 ? void 0 : ref.layer) === 'middleware';
}
function isInMiddlewareFile(parser) {
    var ref, ref3;
    return ((ref = parser.state.current) === null || ref === void 0 ? void 0 : ref.layer) === 'middleware' && /middleware\.\w+$/.test((ref3 = parser.state.current) === null || ref3 === void 0 ? void 0 : ref3.rawRequest);
}
function isNullLiteral(expr) {
    return expr.value === null;
}
function isUndefinedIdentifier(expr) {
    return expr.name === 'undefined';
}

//# sourceMappingURL=middleware-plugin.js.map