"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPageStaticInfo = getPageStaticInfo;
var _extractConstValue = require("./extract-const-value");
var _parseModule = require("./parse-module");
var _fs = require("fs");
async function getPageStaticInfo(params) {
    const { isDev , pageFilePath , nextConfig  } = params;
    const fileContent = await tryToReadFile(pageFilePath, !isDev) || '';
    if (/runtime|getStaticProps|getServerSideProps/.test(fileContent)) {
        const swcAST = await (0, _parseModule).parseModule(pageFilePath, fileContent);
        const { ssg , ssr  } = checkExports(swcAST);
        const config = (0, _extractConstValue).tryToExtractExportedConstValue(swcAST, 'config') || {};
        if ((config === null || config === void 0 ? void 0 : config.runtime) === 'edge') {
            return {
                runtime: config.runtime,
                ssr: ssr,
                ssg: ssg
            };
        }
        // For Node.js runtime, we do static optimization.
        if ((config === null || config === void 0 ? void 0 : config.runtime) === 'nodejs') {
            return {
                runtime: ssr || ssg ? config.runtime : undefined,
                ssr: ssr,
                ssg: ssg
            };
        }
        // When the runtime is required because there is ssr or ssg we fallback
        if (ssr || ssg) {
            var ref;
            return {
                runtime: (ref = nextConfig.experimental) === null || ref === void 0 ? void 0 : ref.runtime,
                ssr: ssr,
                ssg: ssg
            };
        }
    }
    return {
        ssr: false,
        ssg: false
    };
}
/**
 * Receives a parsed AST from SWC and checks if it belongs to a module that
 * requires a runtime to be specified. Those are:
 *   - Modules with `export function getStaticProps | getServerSideProps`
 *   - Modules with `export { getStaticProps | getServerSideProps } <from ...>`
 */ function checkExports(swcAST) {
    if (Array.isArray(swcAST === null || swcAST === void 0 ? void 0 : swcAST.body)) {
        try {
            for (const node of swcAST.body){
                var ref3, ref1;
                if (node.type === 'ExportDeclaration' && ((ref3 = node.declaration) === null || ref3 === void 0 ? void 0 : ref3.type) === 'FunctionDeclaration' && [
                    'getStaticProps',
                    'getServerSideProps'
                ].includes((ref1 = node.declaration.identifier) === null || ref1 === void 0 ? void 0 : ref1.value)) {
                    return {
                        ssg: node.declaration.identifier.value === 'getStaticProps',
                        ssr: node.declaration.identifier.value === 'getServerSideProps'
                    };
                }
                if (node.type === 'ExportNamedDeclaration') {
                    const values = node.specifiers.map((specifier)=>{
                        var ref, ref2;
                        return specifier.type === 'ExportSpecifier' && ((ref = specifier.orig) === null || ref === void 0 ? void 0 : ref.type) === 'Identifier' && ((ref2 = specifier.orig) === null || ref2 === void 0 ? void 0 : ref2.value);
                    });
                    return {
                        ssg: values.some((value)=>[
                                'getStaticProps'
                            ].includes(value)
                        ),
                        ssr: values.some((value)=>[
                                'getServerSideProps'
                            ].includes(value)
                        )
                    };
                }
            }
        } catch (err) {}
    }
    return {
        ssg: false,
        ssr: false
    };
}
async function tryToReadFile(filePath, shouldThrow) {
    try {
        return await _fs.promises.readFile(filePath, {
            encoding: 'utf8'
        });
    } catch (error) {
        if (shouldThrow) {
            throw error;
        }
    }
}

//# sourceMappingURL=get-page-static-info.js.map