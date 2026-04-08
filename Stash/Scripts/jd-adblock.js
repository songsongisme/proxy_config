/*
 * 京东去广告净化 (Stash 版)
 * 拦截首页悬浮球、开屏广告、页面弹窗、物流横幅等
 * 参考: fmz200/wool_scripts
 */

const url = $request.url;
let body = $response.body;

try {
  let obj = JSON.parse(body);

  if (/functionId=welcomeHome/.test(url)) {
    const adFloorTypes = [
      "float",             // 悬浮推广小圆图（悬浮球）
      "bottomXview",       // 底部悬浮通栏推广
      "photoCeiling",      // 顶部通栏动图推广
      "searchIcon",        // 右上角消费券
      "topRotate",         // 左上角 logo 推广
      "ruleFloat",         // 资质与规则悬浮
      "tabBarAtmosphere"   // 底部 Tab 氛围推广
    ];
    if (obj?.floorList?.length > 0) {
      obj.floorList = obj.floorList.filter(i => !adFloorTypes.includes(i?.type));
    }
    if (obj?.webViewFloorList?.length > 0) {
      obj.webViewFloorList = [];
    }

  } else if (/functionId=start/.test(url)) {
    if (obj?.images?.length > 0) {
      obj.images = [];
    }
    if (obj?.showTimesDaily) {
      obj.showTimesDaily = 0;
    }

  } else if (/functionId=personinfoBusiness/.test(url)) {
    const adMIds = [
      "bigSaleFloor", "buyOften", "newAttentionCard", "newBigSaleFloor",
      "newStyleAttentionCard", "newsFloor", "noticeFloor", "recommendfloor"
    ];
    const cleanFloors = (floors) => {
      if (!floors?.length) return floors;
      let result = [];
      for (let floor of floors) {
        if (adMIds.includes(floor?.mId)) continue;
        if (floor?.mId === "basefloorinfo") {
          delete floor?.data?.commonPopup;
          delete floor?.data?.commonPopup_dynamic;
          delete floor?.data?.floatLayer;
          if (floor?.data?.commonTips?.length > 0) floor.data.commonTips = [];
          if (floor?.data?.commonWindows?.length > 0) floor.data.commonWindows = [];
        } else if (floor?.mId === "userinfo") {
          delete floor?.data?.newPlusBlackCard;
        } else if (floor?.mId === "orderIdFloor") {
          if (floor?.data?.commentRemindInfo?.infos?.length > 0) {
            floor.data.commentRemindInfo.infos = [];
          }
        }
        result.push(floor);
      }
      return result;
    };
    obj.floors = cleanFloors(obj.floors);
    if (obj?.others?.floors) {
      obj.others.floors = cleanFloors(obj.others.floors);
    }

  } else if (/functionId=deliverLayer|functionId=orderTrackBusiness/.test(url)) {
    delete obj?.bannerInfo;
    if (obj?.floors?.length > 0) {
      obj.floors = obj.floors.filter(i => !["banner", "jdDeliveryBanner"].includes(i?.mId));
    }

  } else if (/functionId=myOrderInfo/.test(url)) {
    if (obj?.floors?.length > 0) {
      let result = [];
      for (let floor of obj.floors) {
        if (["bannerFloor", "bpDynamicFloor", "plusFloor"].includes(floor?.mId)) continue;
        if (floor?.mId === "virtualServiceCenter" && floor?.data?.virtualServiceCenters?.length > 0) {
          for (let item of floor.data.virtualServiceCenters) {
            if (item?.serviceList?.length > 0) {
              item.serviceList = item.serviceList.filter(c => c?.serviceTitle !== "精选特惠");
            }
          }
        }
        if (floor?.mId === "customerServiceFloor" && floor?.data?.moreText) {
          delete floor.data.moreIcon;
          delete floor.data.moreIcon_dark;
          floor.data.moreText = " ";
        }
        result.push(floor);
      }
      obj.floors = result;
    }

  } else if (/functionId=getTabHomeInfo/.test(url)) {
    delete obj?.result?.iconInfo;
    delete obj?.result?.roofTop;
  }

  body = JSON.stringify(obj);
} catch (e) {
  console.log("jd-adblock error: " + e.message);
}

$done({ body });
