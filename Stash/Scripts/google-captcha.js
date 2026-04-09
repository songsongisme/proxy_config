/*
 * Google 搜索人机验证解决方案 (Stash 版)
 * 参考: @NobyDa 原版多平台脚本
 *
 * 原理: 遇到 CAPTCHA 时并发多节点重试，竞速返回最快成功结果
 * 参数: 通过 stoverride 的 argument 传入节点名正则，如 "香港|美国"
 *       不传则使用所有可用节点
 */

const MAX_NODES = 20;

!(async () => {
  const status = $response.status ?? $response.statusCode;
  if (status === 200) return $done({});

  console.log("[GoogleCAPTCHA] 检测到人机验证，启动并发重试");

  const req = JSON.parse(JSON.stringify($request));
  const policies = await fetchPolicies();

  const regexStr = (typeof $argument === "string" && $argument) ||
                   $persistentStore.read("GOOGLE_CAPTCHA_REGEX") || "";
  const regex = new RegExp(regexStr);

  const candidates = [...policies.groups, ...policies.proxies]
    .filter(n => n && regex.test(n))
    .sort(() => Math.random() - 0.5)
    .slice(0, MAX_NODES);

  console.log(`[GoogleCAPTCHA] 选取 ${candidates.length} 个节点: ${candidates.join(", ")}`);

  if (candidates.length === 0) {
    console.log("[GoogleCAPTCHA] 无可用节点");
    return $done({});
  }

  const result = await raceRequests(req, candidates);

  if (result) {
    console.log(`[GoogleCAPTCHA] 成功，节点: "${result.policy}"`);
    $done({ status: 200, headers: result.headers, body: result.body });
  } else {
    console.log("[GoogleCAPTCHA] 所有节点均失败");
    $done({});
  }
})().catch(e => {
  console.log(`[GoogleCAPTCHA] 异常: ${e.message || e}`);
  $done({});
});

function fetchPolicies() {
  return new Promise(resolve => {
    $httpAPI("GET", "v1/policies", null, data => {
      resolve({
        proxies: data?.proxies || [],
        groups: data?.["policy-groups"] || []
      });
    });
  });
}

function sendRequest(req, policy) {
  return new Promise((resolve, reject) => {
    const headers = { ...req.headers };
    const cookieKey = headers["User-Agent"] ? "Cookie" : "cookie";
    headers[cookieKey] = String(Math.random());

    const opts = { url: req.url, headers, policy };
    if (req.body) opts.body = req.body;

    $httpClient[req.method.toLowerCase()](opts, (err, resp, body) => {
      if (err) {
        console.log(`[GoogleCAPTCHA] "${policy}" 请求失败: ${err}`);
        return reject(err);
      }
      const s = resp.status ?? resp.statusCode;
      if (s === 200) {
        resolve({ policy, headers: resp.headers, body });
      } else {
        console.log(`[GoogleCAPTCHA] "${policy}" HTTP ${s}`);
        reject(new Error(`HTTP ${s}`));
      }
    });
  });
}

function raceRequests(req, candidates) {
  const promises = candidates.map(p => sendRequest(req, p));

  if (typeof Promise.any === "function") {
    return Promise.any(promises).catch(() => null);
  }

  return new Promise(resolve => {
    let settled = false;
    let failures = 0;
    const total = promises.length;

    promises.forEach(p => {
      p.then(val => {
        if (!settled) { settled = true; resolve(val); }
      }).catch(() => {
        if (++failures === total && !settled) resolve(null);
      });
    });
  });
}
