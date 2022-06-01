"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _webpackConfig = require("../../webpack-config");
var _getModuleBuildInfo = require("./get-module-build-info");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function pathToUrlPath(pathname) {
    let urlPath = pathname.replace(/^private-next-app-dir/, '');
    // For `app/layout.js`
    if (urlPath === '') {
        urlPath = '/';
    }
    return urlPath;
}
async function resolveLayoutPathsByPage({ pagePath , resolve  }) {
    var ref, ref1, ref2;
    const layoutPaths = new Map();
    const parts = pagePath.split('/');
    const isNewRootLayout = ((ref = parts[1]) === null || ref === void 0 ? void 0 : ref.length) > 2 && ((ref1 = parts[1]) === null || ref1 === void 0 ? void 0 : ref1.startsWith('(')) && ((ref2 = parts[1]) === null || ref2 === void 0 ? void 0 : ref2.endsWith(')'));
    for(let i = parts.length; i >= 0; i--){
        const pathWithoutSlashLayout = parts.slice(0, i).join('/');
        if (!pathWithoutSlashLayout) {
            continue;
        }
        const layoutPath = `${pathWithoutSlashLayout}/layout`;
        let resolvedLayoutPath = await resolve(layoutPath);
        let urlPath = pathToUrlPath(pathWithoutSlashLayout);
        // if we are in a new root app/(root) and a custom root layout was
        // not provided or a root layout app/layout is not present, we use
        // a default root layout to provide the html/body tags
        const isCustomRootLayout = isNewRootLayout && i === 2;
        if ((isCustomRootLayout || i === 1) && !resolvedLayoutPath) {
            resolvedLayoutPath = await resolve('next/dist/lib/app-layout');
        }
        layoutPaths.set(urlPath, resolvedLayoutPath);
        // if we're in a new root layout don't add the top-level app/layout
        if (isCustomRootLayout) {
            break;
        }
    }
    return layoutPaths;
}
const nextAppLoader = async function nextAppLoader() {
    const { name , appDir , pagePath , pageExtensions  } = this.getOptions() || {};
    const buildInfo = (0, _getModuleBuildInfo).getModuleBuildInfo(this._module);
    buildInfo.route = {
        page: name.replace(/^app/, ''),
        absolutePagePath: appDir + pagePath.replace(/^private-next-app-dir/, '')
    };
    const extensions = pageExtensions.map((extension)=>`.${extension}`
    );
    const resolveOptions = {
        ..._webpackConfig.NODE_RESOLVE_OPTIONS,
        extensions
    };
    const resolve = this.getResolve(resolveOptions);
    const layoutPaths = await resolveLayoutPathsByPage({
        pagePath: pagePath,
        resolve: async (pathname)=>{
            try {
                return await resolve(this.rootContext, pathname);
            } catch (err) {
                if (err.message.includes("Can't resolve")) {
                    return undefined;
                }
                throw err;
            }
        }
    });
    const componentsCode = [];
    for (const [layoutPath, resolvedLayoutPath] of layoutPaths){
        if (resolvedLayoutPath) {
            this.addDependency(resolvedLayoutPath);
            // use require so that we can bust the require cache
            const codeLine = `'${layoutPath}': () => require('${resolvedLayoutPath}')`;
            componentsCode.push(codeLine);
        } else {
            for (const ext of extensions){
                this.addMissingDependency(_path.default.join(appDir, layoutPath, `layout${ext}`));
            }
        }
    }
    // Add page itself to the list of components
    componentsCode.push(`'${pathToUrlPath(pagePath).replace(new RegExp(`(${extensions.join('|')})$`), '')}': () => require('${pagePath}')`);
    const result = `
    export const components = {
        ${componentsCode.join(',\n')}
    };

    export const AppRouter = require('next/dist/client/components/app-router.client.js').default

    export const __next_app_webpack_require__ = __webpack_require__
  `;
    return result;
};
var _default = nextAppLoader;
exports.default = _default;

//# sourceMappingURL=next-app-loader.js.map