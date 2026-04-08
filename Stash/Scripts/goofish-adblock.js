/*
 * 闲鱼去广告净化 (Stash 版)
 * 原作: @ddgksf2013 (墨鱼)
 * 转写: Surge jsonjq → Stash JavaScript
 */

const url = $request.url;
let body = $response.body;

try {
  let obj = JSON.parse(body);

  if (/user\.strategy\.list/.test(url)) {
    // 移除首页右下角悬浮球
    obj.data.strategies = [{}];

  } else if (/home\.circle\.list/.test(url)) {
    // 移除首页顶部"省钱"Tab
    if (obj.data?.circleList) {
      obj.data.circleList = obj.data.circleList.filter(
        i => i.bizCode !== "saveMoney"
      );
    }

  } else if (/home\.nextfresh/.test(url)) {
    // 清理首页信息流广告
    if (obj.data?.homeTopList) {
      obj.data.homeTopList = [obj.data.homeTopList[0]];
    }
    if (obj.data?.sections) {
      obj.data.sections = obj.data.sections.filter(
        i => i.data?.bizType === "item"
      );
    }

  } else if (/search\.shade/.test(url)) {
    // 移除搜索框填充词
    obj.data.singleShadeWords = [{}];

  } else if (/search\.activate/.test(url)) {
    // 移除"猜你可能找"
    obj.data.cardList = [{}];

  } else if (/search\.discover/.test(url)) {
    // 移除搜索发现推荐
    delete obj.data.resultList;

  } else if (/page\.my\.adapter/.test(url)) {
    // 精简"我的"页面
    obj.data.ability = [];
    if (obj.data?.container?.sections) {
      obj.data.container.sections = obj.data.container.sections.filter(
        i => /head|user|trade/.test(i.sectionBizCode)
      );
    }

  } else if (/buy\.feeds/.test(url)) {
    // 移除"我的"页面信息流
    delete obj.data.sections;

  } else if (/local\.home/.test(url)) {
    // 移除本地页面广告
    if (obj.data?.sections) {
      obj.data.sections = obj.data.sections.filter(
        i => i.data?.bizType === "item"
      );
    }

  } else if (/idlemtopsearch\.search(?!\.shade|\.discover|\.activate)/.test(url)) {
    // 移除搜索结果中的广告
    if (obj.data?.resultList) {
      obj.data.resultList = obj.data.resultList.filter(i => {
        try {
          return i.data.item.main.clickParam.args.biz_type === "item";
        } catch (e) {
          return true;
        }
      });
    }

  } else if (/item\.recommend/.test(url)) {
    // 移除商品底部淘宝妈妈广告
    if (obj.data?.cardList) {
      obj.data.cardList = obj.data.cardList.filter(
        i => !i.cardData || i.cardData.bizType !== "mamaAD"
      );
    }
  }

  body = JSON.stringify(obj);
} catch (e) {
  console.log("goofish-adblock error: " + e.message);
}

$done({ body });
