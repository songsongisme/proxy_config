/*
 * CodingPlan 解锁售罄限制 (Stash 版)
 * 将 soldOut 改为 false，使购买按钮可点击
 */

let body = $response.body;

try {
  let obj = JSON.parse(body);

  if (obj?.data?.productList?.length > 0) {
    for (let product of obj.data.productList) {
      product.soldOut = false;
      if (product.canPurchase === null) {
        product.canPurchase = true;
      }
    }
  }

  body = JSON.stringify(obj);
} catch (e) {
  console.log("codingplan-unlock error: " + e.message);
}

$done({ body });
