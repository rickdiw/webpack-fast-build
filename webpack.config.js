var path = require("path");
var glob = require("glob");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");//将你的行内样式提取到单独的css文件里，
var HtmlWebpackPlugin = require("html-webpack-plugin"); //html模板生成器
var CleanPlugin = require("clean-webpack-plugin"); // 文件夹清除工具
var CopyWebpackPlugin = require("copy-webpack-plugin"); // 文件拷贝
var SpritesmithPlugin = require("webpack-spritesmith"); //雪碧图

var argv;
try {
	argv = JSON.parse(process);
}	catch(ex) {
	argv = process.argv;
}

/*console.log(`argv: ${argv[2]}`);*/
var production = argv[2] == "-p" ? true : false;
var dir = production ? "dist" : "dev";

var config = {
	entry: { //配置入口文件，有几个写几个
		index: "./src/js/index.js",
		list: "./src/js/list.js",
		about: "./src/js/about.js"
	},
	output: {
		path: path.join(__dirname, dir), //打包后生成的目录
		publicPath: "",	//模板、样式、脚本、图片等资源对应的server上的路径
		filename: "js/[name].[hash:6].js",	//根据对应入口名称，生成对应js名称
		chunkFilename: "js/[id].chunk.js"   //chunk生成的配置
	},
	resolve: {
		/*root: [],*/
         //设置require或import的时候可以不需要带后缀
        extensions: [".json", ".js", ".less", ".css"]
    },
	module: {
		loaders: [
			/*{
				test: /\.html$/,
				loader: "html-withimg-loader"
			},*/
			{
				test: /\.css$/,
				loader: ExtractTextPlugin.extract({ fallback: "style-loader", use: "css-loader" }) /*ExtractTextPlugin.extract("style", "css")*/
			},
			{
				test: /\.less$/,
				loader: ExtractTextPlugin.extract({ fallback: "style-loader", use: "css-loader!less-loader" })/* ExtractTextPlugin.extract("css!less")*/
			},
			{
				test: /\.js$/,
		        loader: "babel-loader",
		        exclude: /node_modules/,
				options:{
		        	presets: ["es2015"]
		        }
		    },
			{
				test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: "file-loader",
				options: {
					name: "../fonts/[name].[ext]?[hash]" //输出目录以及名称
				}
			},
			{
                test: /\.(png|jpg|gif|svg)$/i,
                loader: "url-loader",
				options: {
                    limit: 30720, //30720 30kb 图片转base64。设置图片大小，小于此数则转换。
                    name: "images/[name].[hash].[ext]" //输出目录以及名称
                }
            }
		]
	},
	plugins: [
		new webpack.ProvidePlugin({ //全局配置加载
           $: "jquery",
           jQuery: "jquery",
           "window.jQuery": "jquery"
        }),
        new CleanPlugin([dir]),// 清空目录文件夹
		new webpack.optimize.CommonsChunkPlugin({
			name: "common", // 将公共模块提取，生成名为`vendors`的chunk
			//minChunks: 3 // 提取至少3个模块共有的部分
		}),
		new ExtractTextPlugin( "css/[name].[hash:6].css"), //提取CSS样式，转化为link引入

		// 雪碧图
		new SpritesmithPlugin({
			// 目标小图标
			src: {
				cwd: path.resolve(__dirname, "./src/images/icons"),
				glob: "*.png"
			},
			// 输出雪碧图文件及样式文件
			target: {
				image: path.resolve(__dirname, "./src/css/sprites/sprite.png"),
				css: path.resolve(__dirname, "./src/css/sprites/sprite.css")
			},
			// 样式文件中调用雪碧图地址写法
			apiOptions: {
				cssImageRef: "../sprites/sprite.png"
			},
			spritesmithOptions: {
				algorithm: "top-down"
			}
		}),

	    /*new CopyWebpackPlugin([
            {from: "./src/images", to: "images"} //拷贝图片
        ]),*/
		new CopyWebpackPlugin([
			{from: "./src/fonts", to: "./fonts"} //拷贝字体
		]),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin()
	],
	externals: {
        $: "jQuery"
    },
    //devtool: "#source-map",
	//使用webpack-dev-server服务器，提高开发效率
	devServer: {
		// contentBase: "./",
		host: "localhost",
		port: 8199, //端口
		inline: true,
		hot: false
	}
};

module.exports = config;

var pages = Object.keys(getEntry("./src/*.html"));

//生成HTML模板
pages.forEach(function(pathname) {
	var itemName  = pathname.split("src\\") //根据系统路径来取文件名，window下的做法//,其它系统另测
    var conf = {
        filename: itemName[1] + ".html", //生成的html存放路径，相对于path
        template: "html-withimg-loader?min=" + production + "!" + pathname + ".html", //html模板路径
		/*template: pathname + ".html",*/
        inject: true, //允许插件修改哪些内容，包括head与body
        hash: false, //是否添加hash值
		chunks: ["common", itemName[1]]/*,
		//minify: false,
        minify: { //压缩HTML文件
			removeComments: false,//移除HTML中的注释
			collapseWhitespace: false, //删除空白符与换行符
			removeAttributeQuotes: false // 移除属性的引号
        }*/
    };
    config.plugins.push(new HtmlWebpackPlugin(conf));
});

//按文件名来获取入口文件（即需要生成的模板文件数量）
function getEntry(globPath) {
    var files = glob.sync(globPath);
    var entries = {},
        entry, dirname, basename, pathname, extname;

    for (var i = 0; i < files.length; i++) {
        entry = files[i];
        dirname = path.dirname(entry);
        extname = path.extname(entry);
        basename = path.basename(entry, extname);
        pathname = path.join(dirname, basename);
        entries[pathname] = "./" + entry;
    }
    return entries;
}