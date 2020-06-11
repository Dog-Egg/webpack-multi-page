import * as path from 'path'
import * as webpack from "webpack"
import * as HtmlWebpackPlugin from "html-webpack-plugin"
import * as FileHound from 'filehound'
import * as _ from 'lodash'
import {matcher} from "./lib/chunksorter"

interface Options {
    context?: string
    configFile?: string
    chunkNamePrefix?: string
    config?: PageConfig
}

interface PageConfig {
    entry?: string
    deprecated?: boolean
    htmlWebpackPluginOptions?: HtmlWebpackPlugin.Options
}

interface ProcessedPageConfig {
    entrypoint: string
    chunkName: string
    htmlWebpackPluginOptions: HtmlWebpackPlugin.Options
}

class WebpackMultiPage {
    private readonly options: Options
    private readonly context: string
    private readonly configFile: string
    private readonly chunkNamePrefix: string
    private _configs?: ProcessedPageConfig[]

    constructor(options: Options = {}) {
        this.options = options
        this.context = options?.context || process.cwd()
        this.configFile = options?.configFile || 'page.config.js'
        this.chunkNamePrefix = options?.chunkNamePrefix || 'page~'
    }

    get entry(): webpack.Entry {
        const entry = {}
        this.configs.forEach(i => {
            entry[i.chunkName] = i.entrypoint
        })
        return entry
    }

    createHtmlWebpackPlugins(options?: HtmlWebpackPlugin.Options): HtmlWebpackPlugin[] {
        const _options = options
        const htmlFilename: string[] = []

        return this.configs.map(c => {
            options = _.defaults({}, _options, c.htmlWebpackPluginOptions)
            options.excludeChunks = this.configs
                .map(c => c.chunkName)
                .filter(i => i !== c.chunkName)
                .concat(options.excludeChunks || [])
            options.chunksSortMode = options.chunksSortMode || matcher([
                new RegExp(`^(?!${this.chunkNamePrefix})`),
                new RegExp(`^${this.chunkNamePrefix}`)
            ])

            // check duplicate filename
            if (options.filename) {
                const filename = options.filename
                if (htmlFilename.includes(filename)) {
                    throw new Error(`Duplicated HTML filename: "${filename}"`)
                } else {
                    htmlFilename.push(filename)
                }
            }

            return new HtmlWebpackPlugin(options)
        })
    }

    private findConfigFiles(): string[] {
        if (!path.isAbsolute(this.context)) {
            throw new Error(`The provided context "${this.context}" is not an absolute path!`)
        }
        return FileHound.create().path(this.context).match(this.configFile).findSync()
    }

    private getProcessedPageConfigs(): ProcessedPageConfig[] {
        const arr: ProcessedPageConfig[] = []
        const configFiles = this.findConfigFiles()
        configFiles.forEach(f => {
            const config: PageConfig = _.defaultsDeep(require(f), this.options.config)
            if (config.deprecated) return
            const nameArray = path.relative(this.context, f).split(path.sep).slice(0, -1)
            arr.push({
                entrypoint: path.join(f, '..', config.entry || 'index.js'),
                chunkName: this.chunkNamePrefix + (nameArray.join('_') || 'index'),
                htmlWebpackPluginOptions: {
                    ...config.htmlWebpackPluginOptions,
                    filename: config.htmlWebpackPluginOptions?.filename || `${nameArray.join('/').toLowerCase() || 'index'}.html`
                }
            })
        })
        return arr
    }

    private get configs(): ProcessedPageConfig[] {
        if (!this._configs) {
            this._configs = this.getProcessedPageConfigs()
        }
        return this._configs
    }

}

export = WebpackMultiPage
