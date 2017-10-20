//引入css
/*import "../less/global.less"
import "../less/index.less"*/

require("../less/global.less");
require("../less/index.less");
/*require("../css/sprites/sprite.css");*/


let test = (temp) => {
    document.title = temp;
}

test("29");

console.log("index");

$('body').append('这是js动态生成的内容：这是index页面！8')

