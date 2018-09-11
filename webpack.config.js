// module.exports = {
//   entry: [
//     './app/js/index.js'
//   ],
//   module: {
//     rules: [
//       {
//         test: /\.(js|jsx)$/,
//         exclude: /node_modules/,
//         use: ['babel-loader']
//       }
//     ]
//   },
//   resolve: {
//     extensions: ['*', '.js', '.jsx']
//   },
//   output: {
//     path: __dirname,
//     filename: 'bundle.js'
//   }
// };
const path = require('path');
console.log(__dirname)

module.exports = {
  devtool: 'source-map',
  entry: './app/js/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname + '/dist/')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: [
          path.resolve(__dirname, './app/js')
        ],
        exclude: [
          path.resolve(__dirname, 'node_modules')
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  }
};
