"use strict";
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FileHound = require("filehound");
const _ = require("lodash");
const chunksorter_1 = require("./lib/chunksorter");
class WebpackMultiPage {
    constructor(options = {}) {
        this.htmlFilenames = [];
        this.options = options;
        this.context = (options === null || options === void 0 ? void 0 : options.context) || process.cwd();
        this.configFile = (options === null || options === void 0 ? void 0 : options.configFile) || 'page.config.js';
        this.chunkNamePrefix = (options === null || options === void 0 ? void 0 : options.chunkNamePrefix) || 'page~';
    }
    get entry() {
        const entry = {};
        this.configs.forEach(i => {
            entry[i.chunkName] = i.entrypoint;
        });
        return entry;
    }
    createHtmlWebpackPlugins(options) {
        const _options = options;
        return this.configs.map(c => {
            options = _.defaults({}, _options, c.htmlWebpackPluginOptions);
            options.excludeChunks = this.configs
                .map(c => c.chunkName)
                .filter(i => i !== c.chunkName)
                .concat(options.excludeChunks || []);
            options.chunksSortMode = options.chunksSortMode || chunksorter_1.matcher([
                new RegExp(`^(?!${this.chunkNamePrefix})`),
                new RegExp(`^${this.chunkNamePrefix}`)
            ]);
            if (options.filename) {
                this.checkHtmlFilename(options.filename);
            }
            return new HtmlWebpackPlugin(options);
        });
    }
    checkHtmlFilename(filename) {
        if (this.htmlFilenames.includes(filename)) {
            throw new Error(`Duplicated HTML filename: "${filename}"`);
        }
        else {
            this.htmlFilenames.push(filename);
        }
    }
    findConfigFiles() {
        if (!path.isAbsolute(this.context)) {
            throw new Error(`The provided context "${this.context}" is not an absolute path!`);
        }
        return FileHound.create().path(this.context).match(this.configFile).findSync();
    }
    getProcessedPageConfigs() {
        const arr = [];
        const configFiles = this.findConfigFiles();
        configFiles.forEach(f => {
            var _a;
            const config = _.defaultsDeep(require(f), this.options.config);
            if (config.deprecated)
                return;
            const nameArray = path.relative(this.context, f).split(path.sep).slice(0, -1);
            arr.push({
                entrypoint: path.join(f, '..', config.entry || 'index.js'),
                chunkName: this.chunkNamePrefix + (nameArray.join('_') || 'index'),
                htmlWebpackPluginOptions: Object.assign(Object.assign({}, config.htmlWebpackPluginOptions), { filename: ((_a = config.htmlWebpackPluginOptions) === null || _a === void 0 ? void 0 : _a.filename) || `${nameArray.join('/').toLowerCase() || 'index'}.html` })
            });
        });
        return arr;
    }
    get configs() {
        if (!this._configs) {
            this._configs = this.getProcessedPageConfigs();
        }
        return this._configs;
    }
}
module.exports = WebpackMultiPage;
