const path = require('path');

module.exports = {
    entry: './src/js/index.js',
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env'
                        ],
                        plugins: [
                            [
                                "@babel/plugin-transform-runtime",
                                {
                                    "corejs": 3
                                }
                            ]
                        ]
                    }
                }
            }
        ]
    },
    output: {
        filename: 'index.min.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'var',
        libraryExport: 'default',
        library: 'CookieConsentDialog'
    }
};