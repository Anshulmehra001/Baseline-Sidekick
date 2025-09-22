"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaselineCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
const baselineData_1 = require("../core/baselineData");
class BaselineCodeActionProvider {
    constructor() {
        this.baselineData = baselineData_1.BaselineDataManager.getInstance();
    }
    provideCodeActions(document, range, context, token) {
        const actions = [];
        // Filter diagnostics to only baseline-related ones
        const baselineDiagnostics = context.diagnostics.filter(diagnostic => diagnostic.source === 'baseline-sidekick' &&
            diagnostic.code &&
            typeof diagnostic.code === 'object' &&
            'value' in diagnostic.code);
        for (const diagnostic of baselineDiagnostics) {
            const featureId = diagnostic.code.value;
            const refactoringActions = this.createRefactoringActions(featureId, diagnostic.range, document);
            actions.push(...refactoringActions);
        }
        return actions;
    }
    createRefactoringActions(featureId, range, document) {
        const actions = [];
        // Get the text at the diagnostic range
        const text = document.getText(range);
        // CSS refactoring actions
        if (featureId.startsWith('css.properties.')) {
            actions.push(...this.createCssRefactoringActions(featureId, range, text, document));
        }
        // JavaScript refactoring actions
        if (featureId.startsWith('api.')) {
            actions.push(...this.createJavaScriptRefactoringActions(featureId, range, text, document));
        }
        return actions;
    }
    createCssRefactoringActions(featureId, range, text, document) {
        const actions = [];
        // Float to Flexbox conversion
        if (featureId === 'css.properties.float' && text.includes('float')) {
            const floatToFlexboxAction = new vscode.CodeAction('Convert float to Flexbox layout', vscode.CodeActionKind.RefactorRewrite);
            floatToFlexboxAction.isPreferred = true;
            const edit = new vscode.WorkspaceEdit();
            // Find the full CSS rule containing the float property
            const fullRange = this.findCssRuleRange(document, range);
            const ruleText = document.getText(fullRange);
            // Convert float-based layout to flexbox
            const refactoredRule = this.convertFloatToFlexbox(ruleText);
            edit.replace(document.uri, fullRange, refactoredRule);
            floatToFlexboxAction.edit = edit;
            actions.push(floatToFlexboxAction);
        }
        return actions;
    }
    createJavaScriptRefactoringActions(featureId, range, text, document) {
        const actions = [];
        // XMLHttpRequest to fetch conversion
        if (featureId === 'api.XMLHttpRequest' && text.includes('XMLHttpRequest')) {
            const xhrToFetchAction = new vscode.CodeAction('Convert XMLHttpRequest to fetch API', vscode.CodeActionKind.RefactorRewrite);
            xhrToFetchAction.isPreferred = true;
            const edit = new vscode.WorkspaceEdit();
            // Find the full XMLHttpRequest usage
            const fullRange = this.findXhrUsageRange(document, range);
            const xhrCode = document.getText(fullRange);
            // Convert XMLHttpRequest to fetch
            const fetchCode = this.convertXhrToFetch(xhrCode);
            edit.replace(document.uri, fullRange, fetchCode);
            xhrToFetchAction.edit = edit;
            actions.push(xhrToFetchAction);
        }
        // Array.at() to bracket notation conversion
        if (featureId === 'api.Array.at' && text.includes('.at(')) {
            const atToBracketAction = new vscode.CodeAction('Convert Array.at() to bracket notation', vscode.CodeActionKind.RefactorRewrite);
            atToBracketAction.isPreferred = true;
            const edit = new vscode.WorkspaceEdit();
            // Convert .at() usage to bracket notation with length check
            const bracketNotation = this.convertAtToBracketNotation(text, range);
            edit.replace(document.uri, range, bracketNotation);
            atToBracketAction.edit = edit;
            actions.push(atToBracketAction);
        }
        return actions;
    }
    findCssRuleRange(document, propertyRange) {
        const text = document.getText();
        const propertyStart = document.offsetAt(propertyRange.start);
        // Find the opening brace of the CSS rule
        let ruleStart = propertyStart;
        while (ruleStart > 0 && text[ruleStart] !== '{') {
            ruleStart--;
        }
        // Include the selector before the opening brace
        while (ruleStart > 0 && /\s/.test(text[ruleStart - 1])) {
            ruleStart--;
        }
        let selectorStart = ruleStart;
        while (selectorStart > 0 && text[selectorStart - 1] !== '}' && text[selectorStart - 1] !== '\n') {
            selectorStart--;
        }
        // Find the closing brace of the CSS rule
        let ruleEnd = propertyStart;
        while (ruleEnd < text.length && text[ruleEnd] !== '}') {
            ruleEnd++;
        }
        if (ruleEnd < text.length) {
            ruleEnd++; // Include the closing brace
        }
        return new vscode.Range(document.positionAt(selectorStart), document.positionAt(ruleEnd));
    }
    convertFloatToFlexbox(ruleText) {
        if (!ruleText) {
            return ruleText;
        }
        // Extract selector and properties
        const selectorMatch = ruleText.match(/^([^{]+)\{/);
        const selector = selectorMatch ? selectorMatch[1].trim() : '';
        // Remove float properties and add flexbox properties
        let properties = ruleText.replace(/^[^{]+\{/, '').replace(/\}$/, '');
        // Remove float-related properties
        properties = properties.replace(/\s*float\s*:\s*[^;]+;?\s*/g, '');
        properties = properties.replace(/\s*clear\s*:\s*[^;]+;?\s*/g, '');
        // Add flexbox properties
        const flexboxProperties = `
    display: flex;
    flex-wrap: wrap;`;
        // Clean up and format
        properties = properties.trim();
        if (properties && !properties.endsWith(';')) {
            properties += ';';
        }
        return `${selector} {${flexboxProperties}${properties ? '\n    ' + properties : ''}
}`;
    }
    findXhrUsageRange(document, range) {
        const text = document.getText();
        const startOffset = document.offsetAt(range.start);
        // Find the start of the XMLHttpRequest instantiation or usage
        let usageStart = startOffset;
        while (usageStart > 0 && !/[\n;{}]/.test(text[usageStart - 1])) {
            usageStart--;
        }
        // Find the end of the XMLHttpRequest usage (look for semicolon or block end)
        let usageEnd = startOffset;
        let braceCount = 0;
        while (usageEnd < text.length) {
            const char = text[usageEnd];
            if (char === '{')
                braceCount++;
            if (char === '}')
                braceCount--;
            if ((char === ';' || char === '\n') && braceCount === 0) {
                if (char === ';')
                    usageEnd++;
                break;
            }
            usageEnd++;
        }
        return new vscode.Range(document.positionAt(usageStart), document.positionAt(usageEnd));
    }
    convertXhrToFetch(xhrCode) {
        if (!xhrCode) {
            return xhrCode;
        }
        // Simple XMLHttpRequest to fetch conversion
        // This is a basic implementation - in practice, you'd want more sophisticated parsing
        if (xhrCode.includes('new XMLHttpRequest()')) {
            // Basic GET request conversion
            if (xhrCode.includes('.open(') && xhrCode.includes('GET')) {
                const urlMatch = xhrCode.match(/\.open\(['"]GET['"],\s*['"]([^'"]+)['"]/);
                const url = urlMatch ? urlMatch[1] : 'URL_HERE';
                return `fetch('${url}')
    .then(response => response.json())
    .then(data => {
        // Handle response data
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });`;
            }
            // Basic POST request conversion
            if (xhrCode.includes('.open(') && xhrCode.includes('POST')) {
                const urlMatch = xhrCode.match(/\.open\(['"]POST['"],\s*['"]([^'"]+)['"]/);
                const url = urlMatch ? urlMatch[1] : 'URL_HERE';
                return `fetch('${url}', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
})
    .then(response => response.json())
    .then(data => {
        // Handle response data
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });`;
            }
        }
        // Fallback: generic fetch conversion
        return `fetch(url)
    .then(response => response.json())
    .then(data => {
        // Handle response data
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });`;
    }
    convertAtToBracketNotation(text, range) {
        // Convert array.at(index) to array[index >= 0 ? index : array.length + index]
        const atMatch = text.match(/(.+)\.at\(([^)]+)\)/);
        if (atMatch) {
            const arrayExpression = atMatch[1];
            const indexExpression = atMatch[2];
            // For negative indices, we need to handle the length calculation
            return `${arrayExpression}[${indexExpression} >= 0 ? ${indexExpression} : ${arrayExpression}.length + ${indexExpression}]`;
        }
        return text; // Fallback if pattern doesn't match
    }
}
exports.BaselineCodeActionProvider = BaselineCodeActionProvider;
//# sourceMappingURL=codeActionProvider.js.map