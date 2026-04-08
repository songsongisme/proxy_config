/*
 * 阿里系 AMDC 调度处理
 * 原作: @ddgksf2013 (墨鱼)
 * 防止 App 切换到难以拦截的备用 API 域名
 */

let body = $response.body;

try {
  let obj = JSON.parse(body);
  if (obj.data) {
    for (let key in obj.data) {
      if (obj.data[key]?.unit_list) {
        obj.data[key].unit_list = [];
      }
    }
  }
  body = JSON.stringify(obj);
} catch (e) {
  console.log("amdc error: " + e.message);
}

$done({ body });
