var path = require('path')

var main = {
    entry: ['./src/myscript.ts'],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/, loader: 'ts-loader'
            }
        ]
    },
    externals: {
        webkit: 'webkit',
        firebase: 'firebase',
        config: 'mc_config'
    }
}

module.exports = [main]
