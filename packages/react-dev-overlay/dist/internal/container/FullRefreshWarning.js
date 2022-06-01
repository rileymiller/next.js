"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
exports.__esModule = true;
exports.styles = exports.FullRefreshWarning = void 0;
var React = __importStar(require("react"));
var Dialog_1 = require("../components/Dialog");
var Overlay_1 = require("../components/Overlay");
var Terminal_1 = require("../components/Terminal");
var noop_template_1 = require("../helpers/noop-template");
var FULL_REFRESH_STORAGE_KEY = '_has_warned_about_full_refresh';
var FullRefreshWarning = function FullRefreshWarning(_a) {
    var reason = _a.reason;
    var reload = React.useCallback(function () {
        window.location.reload();
    }, []);
    var change = React.useCallback(function (e) {
        sessionStorage.setItem(FULL_REFRESH_STORAGE_KEY, e.target.checked ? 'ignore' : 'true');
    }, []);
    return (React.createElement(Overlay_1.Overlay, { fixed: true },
        React.createElement(Dialog_1.Dialog, { type: "warning", "aria-labelledby": "nextjs__container_refresh_warning_label", "aria-describedby": "nextjs__container_refresh_warning_desc", onClose: reload },
            React.createElement(Dialog_1.DialogContent, null,
                React.createElement(Dialog_1.DialogHeader, { className: "nextjs-container-refresh-warning-header" },
                    React.createElement("h4", { id: "nextjs__container_refresh_warning_label" }, "About to perform a full refresh")),
                React.createElement(Dialog_1.DialogBody, { className: "nextjs-container-refresh-warning-body" },
                    React.createElement(FullRefreshWarningReason, { reason: reason }),
                    React.createElement("footer", null,
                        React.createElement("p", null,
                            "You can read more about Fast Refresh in",
                            ' ',
                            React.createElement("a", { href: "https://nextjs.org/docs/basic-features/fast-refresh#how-it-works" }, "our documentation"),
                            "."),
                        React.createElement("label", null,
                            React.createElement("input", { type: "checkbox", onChange: change }),
                            " Don't show again for session"),
                        React.createElement("button", { onClick: reload }, "Reload")))))));
};
exports.FullRefreshWarning = FullRefreshWarning;
exports.styles = (0, noop_template_1.noop)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  .nextjs-container-refresh-warning-header > h4 {\n    line-height: 1.5;\n    margin: 0;\n    padding: 0;\n  }\n\n  .nextjs-container-refresh-warning-body footer {\n    margin-top: var(--size-gap-double);\n  }\n\n  .nextjs-container-build-error-body p {\n    color: #757575;\n  }\n\n  .nextjs-container-refresh-warning-body button {\n    background-color: var(--color-ansi-yellow);\n    border: 0;\n    border-radius: var(--size-gap-half);\n    color: var(--color-ansi-black);\n    cursor: pointer;\n    display: block;\n    margin-left: auto;\n    padding: calc(var(--size-gap) + var(--size-gap-half))\n      calc(var(--size-gap-double) + var(--size-gap-half));\n    transition: background-color 0.25s ease;\n  }\n\n  .nextjs-container-refresh-warning-body button:hover {\n    background-color: var(--color-ansi-bright-yellow);\n  }\n"], ["\n  .nextjs-container-refresh-warning-header > h4 {\n    line-height: 1.5;\n    margin: 0;\n    padding: 0;\n  }\n\n  .nextjs-container-refresh-warning-body footer {\n    margin-top: var(--size-gap-double);\n  }\n\n  .nextjs-container-build-error-body p {\n    color: #757575;\n  }\n\n  .nextjs-container-refresh-warning-body button {\n    background-color: var(--color-ansi-yellow);\n    border: 0;\n    border-radius: var(--size-gap-half);\n    color: var(--color-ansi-black);\n    cursor: pointer;\n    display: block;\n    margin-left: auto;\n    padding: calc(var(--size-gap) + var(--size-gap-half))\n      calc(var(--size-gap-double) + var(--size-gap-half));\n    transition: background-color 0.25s ease;\n  }\n\n  .nextjs-container-refresh-warning-body button:hover {\n    background-color: var(--color-ansi-bright-yellow);\n  }\n"])));
var FullRefreshWarningReason = function (_a) {
    var reason = _a.reason;
    if (reason === null) {
        return (React.createElement("p", null, "Fast Refresh will perform a full reload because your application had an unrecoverable error."));
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("p", null, "Fast Refresh will perform a full reload when you edit a file that is imported by modules outside of the React rendering tree. It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh. Fast Refresh requires at least one parent function component in your React tree."),
        React.createElement("p", null, "You can find more information in the related error below:"),
        React.createElement(Terminal_1.Terminal, { content: reason })));
};
var templateObject_1;
//# sourceMappingURL=FullRefreshWarning.js.map